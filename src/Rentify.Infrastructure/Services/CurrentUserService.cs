using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Rentify.Application.Interfaces;

namespace Rentify.Infrastructure.Services;

/// <summary>
/// Real implementation of ICurrentUserService, reading the authenticated user's Id from the
/// JWT's NameIdentifier claim via IHttpContextAccessor. Replaces NullCurrentUserService now
/// that JWT authentication exists — NullCurrentUserService is deleted, not extended, per its
/// own doc comment from Phase 3.
/// </summary>
public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? UserId => _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

    public bool IsInRole(string role) => _httpContextAccessor.HttpContext?.User?.IsInRole(role) ?? false;
}
