using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;
using Rentify.API.Common;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Rentify.API.Swagger;

/// <summary>
/// Derives per-endpoint OpenAPI details from what the code already declares, instead of
/// hand-annotating every action with [ProducesResponseType]:
///
///  - Endpoints requiring authorization ([Authorize] on the action or controller, and no
///    [AllowAnonymous] on the action) get the bearer security requirement — so only those
///    show a lock in Swagger UI — plus documented 401 and 403 responses.
///  - Every error response uses the single <see cref="ApiErrorResponse"/> shape written by
///    GlobalExceptionHandler, so the docs match what clients actually receive.
///
/// The status codes listed are the ones the app can genuinely produce for that kind of
/// endpoint (404 only when the route has an id, 422 only when there is a body to validate, ...).
/// </summary>
public class AuthAndErrorResponsesOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var method = context.MethodInfo;
        var controllerAttributes = method.DeclaringType?.GetCustomAttributes(inherit: true) ?? Array.Empty<object>();
        var actionAttributes = method.GetCustomAttributes(inherit: true);

        var allowsAnonymous = actionAttributes.OfType<AllowAnonymousAttribute>().Any();
        var requiresAuth = !allowsAnonymous
            && actionAttributes.Concat(controllerAttributes).OfType<IAuthorizeData>().Any();

        var httpMethod = context.ApiDescription.HttpMethod?.ToUpperInvariant();
        var isWrite = httpMethod is "POST" or "PUT" or "PATCH" or "DELETE";
        var hasRouteParameter = context.ApiDescription.RelativePath?.Contains('{') == true;
        var hasBody = context.ApiDescription.ParameterDescriptions
            .Any(p => p.Source == Microsoft.AspNetCore.Mvc.ModelBinding.BindingSource.Body);

        if (requiresAuth)
        {
            operation.Security = new List<OpenApiSecurityRequirement>
            {
                new()
                {
                    [new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = SwaggerServiceExtensions.BearerSchemeName,
                        },
                    }] = Array.Empty<string>(),
                },
            };

            AddError(operation, context, StatusCodes.Status401Unauthorized, "Missing, invalid or expired access token.");
            AddError(operation, context, StatusCodes.Status403Forbidden, "Authenticated, but not allowed (wrong role, or not the owner of this record).");
        }

        if (hasRouteParameter)
        {
            AddError(operation, context, StatusCodes.Status404NotFound, "The resource does not exist (or is not visible to the caller).");
        }

        if (isWrite)
        {
            AddError(operation, context, StatusCodes.Status409Conflict, "The request conflicts with the current state (duplicate, invalid status transition, ...).");
        }

        if (hasBody)
        {
            AddError(operation, context, StatusCodes.Status422UnprocessableEntity, "Validation failed. `errors` lists each violation.");
        }

        AddError(operation, context, StatusCodes.Status500InternalServerError, "Unexpected server error (details are hidden outside Development).");
    }

    private static void AddError(OpenApiOperation operation, OperationFilterContext context, int statusCode, string description)
    {
        var schema = context.SchemaGenerator.GenerateSchema(typeof(ApiErrorResponse), context.SchemaRepository);

        // TryAdd: never overwrite a response a controller documented explicitly.
        operation.Responses.TryAdd(statusCode.ToString(), new OpenApiResponse
        {
            Description = description,
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["application/json"] = new OpenApiMediaType { Schema = schema },
            },
        });
    }
}
