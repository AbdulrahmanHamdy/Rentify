namespace Rentify.Application.DTOs.Properties;

public record UpdatePropertyRequest(
    string Name,
    string Address,
    string? City,
    string? Description);
