using Microsoft.EntityFrameworkCore;
using Rentify.Application.Interfaces;
using Rentify.Domain.Entities;
using Rentify.Infrastructure.Persistence;

namespace Rentify.Infrastructure.Persistence.Repositories;

public class OwnerProfileRepository : IOwnerProfileRepository
{
    private readonly RentifyDbContext _dbContext;

    public OwnerProfileRepository(RentifyDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<OwnerProfile?> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        return await _dbContext.OwnerProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.UserId == userId, cancellationToken);
    }
}
