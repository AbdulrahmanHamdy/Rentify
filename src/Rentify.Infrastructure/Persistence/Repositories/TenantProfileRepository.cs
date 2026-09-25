using Microsoft.EntityFrameworkCore;
using Rentify.Application.Interfaces;
using Rentify.Domain.Entities;

namespace Rentify.Infrastructure.Persistence.Repositories;

public class TenantProfileRepository : ITenantProfileRepository
{
    private readonly RentifyDbContext _dbContext;

    public TenantProfileRepository(RentifyDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<TenantProfile?> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        return await _dbContext.TenantProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.UserId == userId, cancellationToken);
    }
}
