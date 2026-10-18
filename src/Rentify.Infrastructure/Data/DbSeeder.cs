using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Rentify.Domain.Constants;
using Rentify.Domain.Entities;
using Rentify.Domain.Enums;
using Rentify.Infrastructure.Identity;
using Rentify.Infrastructure.Persistence;

namespace Rentify.Infrastructure.Data;

/// <summary>
/// Development-only database seeder. Populates realistic test data for properties,
/// units, rental contracts, payments, maintenance requests, and amenities to support
/// development and UI testing across Owner and Tenant portals.
/// Idempotent: checks for existing data before inserting and never modifies or deletes
/// existing rows.
/// </summary>
public static class DbSeeder
{
    public const string DefaultDevPassword = "DevPassword123!";

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var logger = serviceProvider.GetRequiredService<ILoggerFactory>().CreateLogger(typeof(DbSeeder));
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var dbContext = serviceProvider.GetRequiredService<RentifyDbContext>();

        logger.LogInformation("Starting development database seeding check...");

        // 1. Seed or resolve users and their domain profiles
        var (owners, tenants) = await SeedUsersAndProfilesAsync(userManager, dbContext, logger);

        // 2. Seed amenities
        var amenities = await SeedAmenitiesAsync(dbContext, logger);

        // 3. Seed properties, units, images, and property amenities
        var properties = await SeedPropertiesAsync(dbContext, owners, amenities, logger);

        // 4. Seed rental contracts
        var activeContract = await SeedContractsAsync(dbContext, properties, tenants, logger);

        // 5. Seed payments for the main tenant's active contract
        if (activeContract is not null)
        {
            await SeedPaymentsAsync(dbContext, activeContract, logger);
            await SeedMaintenanceRequestsAsync(dbContext, activeContract, owners[0].User.Id, logger);
        }

        logger.LogInformation("Development database seeding check completed successfully.");
    }

    private record UserProfilePair<TProfile>(ApplicationUser User, TProfile Profile);

    private static async Task<(List<UserProfilePair<OwnerProfile>> Owners, List<UserProfilePair<TenantProfile>> Tenants)>
        SeedUsersAndProfilesAsync(
            UserManager<ApplicationUser> userManager,
            RentifyDbContext dbContext,
            ILogger logger)
    {
        var ownerSeedConfigs = new[]
        {
            new
            {
                Email = "ownerhamdy4587@gmail.com",
                FirstName = "Hamdy",
                LastName = "Owner",
                PhoneNumber = "+201001234567",
                CompanyName = "Hamdy Real Estate Investment"
            },
            new
            {
                Email = "noha.owner@rentify.dev",
                FirstName = "Noha",
                LastName = "El-Sayed",
                PhoneNumber = "+201098765432",
                CompanyName = "Nile Crest Properties"
            }
        };

        var tenantSeedConfigs = new[]
        {
            new
            {
                Email = "abdohamdy4587@gmail.com",
                FirstName = "Abdo",
                LastName = "Hamdy",
                PhoneNumber = "+201112345678",
                NationalId = "29801011234567"
            },
            new
            {
                Email = "sayedhamdy4587@gmail.com",
                FirstName = "Sayed",
                LastName = "Hamdy",
                PhoneNumber = "+201123456789",
                NationalId = "29905151234567"
            },
            new
            {
                Email = "waleed195mokhtar@gmail.com",
                FirstName = "Waleed",
                LastName = "Mokhtar",
                PhoneNumber = "+201134567890",
                NationalId = "29712011234568"
            }
        };

        var resolvedOwners = new List<UserProfilePair<OwnerProfile>>();
        foreach (var config in ownerSeedConfigs)
        {
            var user = await userManager.FindByEmailAsync(config.Email);
            if (user is null)
            {
                user = new ApplicationUser
                {
                    UserName = config.Email,
                    Email = config.Email,
                    FirstName = config.FirstName,
                    LastName = config.LastName,
                    PhoneNumber = config.PhoneNumber,
                    EmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow
                };

                var createResult = await userManager.CreateAsync(user, DefaultDevPassword);
                if (!createResult.Succeeded)
                {
                    var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                    throw new InvalidOperationException($"Failed to create seed owner {config.Email}: {errors}");
                }

                logger.LogInformation("Created seed owner account: {Email}", config.Email);
            }

            if (!await userManager.IsInRoleAsync(user, Roles.Owner))
            {
                await userManager.AddToRoleAsync(user, Roles.Owner);
            }

            var profile = await dbContext.OwnerProfiles.FirstOrDefaultAsync(p => p.UserId == user.Id);
            if (profile is null)
            {
                profile = new OwnerProfile
                {
                    UserId = user.Id,
                    CompanyName = config.CompanyName,
                    PhoneNumber = config.PhoneNumber
                };
                dbContext.OwnerProfiles.Add(profile);
                await dbContext.SaveChangesAsync();
                logger.LogInformation("Created OwnerProfile for {Email}", config.Email);
            }

            resolvedOwners.Add(new UserProfilePair<OwnerProfile>(user, profile));
        }

        var resolvedTenants = new List<UserProfilePair<TenantProfile>>();
        foreach (var config in tenantSeedConfigs)
        {
            var user = await userManager.FindByEmailAsync(config.Email);
            if (user is null)
            {
                user = new ApplicationUser
                {
                    UserName = config.Email,
                    Email = config.Email,
                    FirstName = config.FirstName,
                    LastName = config.LastName,
                    PhoneNumber = config.PhoneNumber,
                    EmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow
                };

                var createResult = await userManager.CreateAsync(user, DefaultDevPassword);
                if (!createResult.Succeeded)
                {
                    var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                    throw new InvalidOperationException($"Failed to create seed tenant {config.Email}: {errors}");
                }

                logger.LogInformation("Created seed tenant account: {Email}", config.Email);
            }

            if (!await userManager.IsInRoleAsync(user, Roles.Tenant))
            {
                await userManager.AddToRoleAsync(user, Roles.Tenant);
            }

            var profile = await dbContext.TenantProfiles.FirstOrDefaultAsync(p => p.UserId == user.Id);
            if (profile is null)
            {
                profile = new TenantProfile
                {
                    UserId = user.Id,
                    PhoneNumber = config.PhoneNumber,
                    NationalId = config.NationalId
                };
                dbContext.TenantProfiles.Add(profile);
                await dbContext.SaveChangesAsync();
                logger.LogInformation("Created TenantProfile for {Email}", config.Email);
            }

            resolvedTenants.Add(new UserProfilePair<TenantProfile>(user, profile));
        }

        return (resolvedOwners, resolvedTenants);
    }

    private static async Task<Dictionary<string, Amenity>> SeedAmenitiesAsync(
        RentifyDbContext dbContext,
        ILogger logger)
    {
        var defaultAmenities = new (string Name, string Icon)[]
        {
            ("Wi-Fi", "wifi"),
            ("Parking", "car"),
            ("Elevator", "arrow-up-down"),
            ("Air conditioning", "snowflake"),
            ("Balcony", "sun"),
            ("Security", "shield-check"),
            ("Furnished", "sofa"),
            ("Gym", "dumbbell")
        };

        if (!await dbContext.Amenities.AnyAsync())
        {
            logger.LogInformation("Seeding default amenities...");
            var amenityEntities = defaultAmenities.Select(a => new Amenity
            {
                Name = a.Name,
                Icon = a.Icon
            }).ToList();

            dbContext.Amenities.AddRange(amenityEntities);
            await dbContext.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} amenities.", amenityEntities.Count);
        }

        return await dbContext.Amenities.ToDictionaryAsync(a => a.Name);
    }

    private static async Task<List<Property>> SeedPropertiesAsync(
        RentifyDbContext dbContext,
        List<UserProfilePair<OwnerProfile>> owners,
        Dictionary<string, Amenity> amenities,
        ILogger logger)
    {
        if (await dbContext.Properties.AnyAsync())
        {
            logger.LogInformation("Properties table already populated; skipping property seeding.");
            return await dbContext.Properties
                .Include(p => p.Units)
                .Include(p => p.Images)
                .ToListAsync();
        }

        logger.LogInformation("Seeding Egyptian properties and units...");

        var owner1 = owners[0].Profile;
        var owner2 = owners.Count > 1 ? owners[1].Profile : owners[0].Profile;

        Amenity? GetAmenity(string name) => amenities.TryGetValue(name, out var val) ? val : null;

        List<PropertyAmenity> BuildAmenities(params string[] names)
        {
            var list = new List<PropertyAmenity>();
            foreach (var n in names)
            {
                var a = GetAmenity(n);
                if (a is not null)
                {
                    list.Add(new PropertyAmenity { AmenityId = a.Id });
                }
            }
            return list;
        }

        var propertiesToSeed = new List<Property>
        {
            // 1. Zamalek - Cairo (Owner 1)
            new Property
            {
                OwnerProfileId = owner1.Id,
                Name = "Nile Crest Zamalek Residence",
                Address = "14 Gezira Street, Zamalek",
                City = "Cairo",
                Description = "Luxurious modern apartment overlooking the Nile River in prestigious Zamalek, featuring high ceilings, hardwood flooring, and 24/7 security concierge.",
                Images = new List<PropertyImage>
                {
                    new() { Url = "https://picsum.photos/seed/zamalek1/800/600", IsPrimary = true },
                    new() { Url = "https://picsum.photos/seed/zamalek2/800/600", IsPrimary = false },
                    new() { Url = "https://picsum.photos/seed/zamalek3/800/600", IsPrimary = false },
                },
                PropertyAmenities = BuildAmenities("Wi-Fi", "Elevator", "Air conditioning", "Balcony", "Security"),
                Units = new List<Unit>
                {
                    new()
                    {
                        UnitNumber = "301",
                        Floor = 3,
                        AreaSqm = 185.0,
                        Bedrooms = 3,
                        Bathrooms = 2,
                        MonthlyRent = 32000m,
                        DepositAmount = 32000m,
                        Status = UnitStatus.Rented // Main tenant's active contract
                    },
                    new()
                    {
                        UnitNumber = "302",
                        Floor = 3,
                        AreaSqm = 140.0,
                        Bedrooms = 2,
                        Bathrooms = 2,
                        MonthlyRent = 25000m,
                        DepositAmount = 25000m,
                        Status = UnitStatus.Available
                    }
                }
            },

            // 2. Pyramids Heights - Giza (Owner 1)
            new Property
            {
                OwnerProfileId = owner1.Id,
                Name = "Pyramids Heights Garden Villa",
                Address = "Cairo-Alexandria Desert Road, KM 22",
                City = "Giza",
                Description = "Stand-alone luxury villa with private landscaped garden and panoramic views towards the Great Pyramids. Features private pool and double garage.",
                Images = new List<PropertyImage>
                {
                    new() { Url = "https://picsum.photos/seed/pyramids1/800/600", IsPrimary = true },
                    new() { Url = "https://picsum.photos/seed/pyramids2/800/600", IsPrimary = false },
                    new() { Url = "https://picsum.photos/seed/pyramids3/800/600", IsPrimary = false },
                },
                PropertyAmenities = BuildAmenities("Wi-Fi", "Parking", "Air conditioning", "Balcony", "Security", "Furnished", "Gym"),
                Units = new List<Unit>
                {
                    new()
                    {
                        UnitNumber = "Villa 4",
                        Floor = 1,
                        AreaSqm = 420.0,
                        Bedrooms = 5,
                        Bathrooms = 4,
                        MonthlyRent = 75000m,
                        DepositAmount = 150000m,
                        Status = UnitStatus.Available // Expired past lease
                    }
                }
            },

            // 3. Palm Hills - 6th of October (Owner 1)
            new Property
            {
                OwnerProfileId = owner1.Id,
                Name = "Palm Hills Executive Duplex",
                Address = "Palm Hills Compound, Street 9",
                City = "6th of October",
                Description = "Spacious duplex apartment inside Palm Hills with direct clubhouse and golf course access. Premium Italian kitchen and expansive terrace.",
                Images = new List<PropertyImage>
                {
                    new() { Url = "https://picsum.photos/seed/palmhills1/800/600", IsPrimary = true },
                    new() { Url = "https://picsum.photos/seed/palmhills2/800/600", IsPrimary = false },
                },
                PropertyAmenities = BuildAmenities("Wi-Fi", "Parking", "Elevator", "Air conditioning", "Balcony", "Security", "Gym"),
                Units = new List<Unit>
                {
                    new()
                    {
                        UnitNumber = "D-12",
                        Floor = 2,
                        AreaSqm = 280.0,
                        Bedrooms = 4,
                        Bathrooms = 3,
                        MonthlyRent = 45000m,
                        DepositAmount = 45000m,
                        Status = UnitStatus.Reserved // Main tenant's pending contract
                    }
                }
            },

            // 4. Degla Palms - 6th of October (Owner 1)
            new Property
            {
                OwnerProfileId = owner1.Id,
                Name = "Degla Palms Cozy Studio",
                Address = "Degla Gardens, Building 45",
                City = "6th of October",
                Description = "Charming, fully furnished studio apartment ideal for young professionals or university students. Fully equipped kitchenette and high-speed fiber.",
                Images = new List<PropertyImage>
                {
                    new() { Url = "https://picsum.photos/seed/degla1/800/600", IsPrimary = true },
                    new() { Url = "https://picsum.photos/seed/degla2/800/600", IsPrimary = false },
                },
                PropertyAmenities = BuildAmenities("Wi-Fi", "Air conditioning", "Furnished", "Security"),
                Units = new List<Unit>
                {
                    new()
                    {
                        UnitNumber = "S-105",
                        Floor = 1,
                        AreaSqm = 60.0,
                        Bedrooms = 1,
                        Bathrooms = 1,
                        MonthlyRent = 11500m,
                        DepositAmount = 11500m,
                        Status = UnitStatus.Available
                    }
                }
            },

            // 5. San Stefano - Alexandria (Owner 1)
            new Property
            {
                OwnerProfileId = owner1.Id,
                Name = "San Stefano Seafront Suite",
                Address = "399 El Geish Road, San Stefano",
                City = "Alexandria",
                Description = "Direct panoramic Mediterranean Sea views with private beach access and steps from San Stefano Grand Plaza, dining, and shopping.",
                Images = new List<PropertyImage>
                {
                    new() { Url = "https://picsum.photos/seed/sanstefano1/800/600", IsPrimary = true },
                    new() { Url = "https://picsum.photos/seed/sanstefano2/800/600", IsPrimary = false },
                    new() { Url = "https://picsum.photos/seed/sanstefano3/800/600", IsPrimary = false },
                },
                PropertyAmenities = BuildAmenities("Wi-Fi", "Parking", "Elevator", "Air conditioning", "Balcony", "Security"),
                Units = new List<Unit>
                {
                    new()
                    {
                        UnitNumber = "12A",
                        Floor = 12,
                        AreaSqm = 195.0,
                        Bedrooms = 3,
                        Bathrooms = 2,
                        MonthlyRent = 28000m,
                        DepositAmount = 28000m,
                        Status = UnitStatus.Available // Terminated contract in past
                    }
                }
            },

            // 6. Lake View Residence - New Cairo (Owner 1)
            new Property
            {
                OwnerProfileId = owner1.Id,
                Name = "Lake View Residence 5th Settlement",
                Address = "North Investors Area, 90th Street North",
                City = "New Cairo",
                Description = "Contemporary apartment surrounded by tranquil water features, lush greenery, and prime dining spots in the Fifth Settlement.",
                Images = new List<PropertyImage>
                {
                    new() { Url = "https://picsum.photos/seed/lakeview1/800/600", IsPrimary = true },
                    new() { Url = "https://picsum.photos/seed/lakeview2/800/600", IsPrimary = false },
                    new() { Url = "https://picsum.photos/seed/lakeview3/800/600", IsPrimary = false },
                },
                PropertyAmenities = BuildAmenities("Wi-Fi", "Parking", "Elevator", "Air conditioning", "Balcony", "Security", "Gym"),
                Units = new List<Unit>
                {
                    new()
                    {
                        UnitNumber = "LV-204",
                        Floor = 2,
                        AreaSqm = 170.0,
                        Bedrooms = 3,
                        Bathrooms = 2,
                        MonthlyRent = 34000m,
                        DepositAmount = 34000m,
                        Status = UnitStatus.Maintenance // Unavailable due to maintenance
                    },
                    new()
                    {
                        UnitNumber = "LV-205",
                        Floor = 2,
                        AreaSqm = 160.0,
                        Bedrooms = 2,
                        Bathrooms = 2,
                        MonthlyRent = 30000m,
                        DepositAmount = 30000m,
                        Status = UnitStatus.Available
                    }
                }
            },

            // 7. Maadi Degla - Cairo (Owner 2)
            new Property
            {
                OwnerProfileId = owner2.Id,
                Name = "Maadi Degla Greenery Flat",
                Address = "Street 233, Degla Maadi",
                City = "Cairo",
                Description = "Quiet expat-friendly residential flat with lush tree-lined streets, walk to international schools, organic groceries, and artisan cafés.",
                Images = new List<PropertyImage>
                {
                    new() { Url = "https://picsum.photos/seed/maadi1/800/600", IsPrimary = true },
                    new() { Url = "https://picsum.photos/seed/maadi2/800/600", IsPrimary = false },
                    new() { Url = "https://picsum.photos/seed/maadi3/800/600", IsPrimary = false },
                },
                PropertyAmenities = BuildAmenities("Wi-Fi", "Parking", "Elevator", "Air conditioning", "Balcony", "Security", "Furnished"),
                Units = new List<Unit>
                {
                    new()
                    {
                        UnitNumber = "2B",
                        Floor = 2,
                        AreaSqm = 210.0,
                        Bedrooms = 3,
                        Bathrooms = 2,
                        MonthlyRent = 29000m,
                        DepositAmount = 29000m,
                        Status = UnitStatus.Available // Cancelled contract in past
                    }
                }
            },

            // 8. Mivida Boulevard - New Cairo (Owner 2)
            new Property
            {
                OwnerProfileId = owner2.Id,
                Name = "Mivida Boulevard Modern Apartment",
                Address = "Road 90 South, Mivida Compound",
                City = "New Cairo",
                Description = "Emaar developed luxury community with world-class clubhouse, jogging tracks, Central Park, and international healthcare facilities.",
                Images = new List<PropertyImage>
                {
                    new() { Url = "https://picsum.photos/seed/mivida1/800/600", IsPrimary = true },
                    new() { Url = "https://picsum.photos/seed/mivida2/800/600", IsPrimary = false },
                },
                PropertyAmenities = BuildAmenities("Wi-Fi", "Parking", "Elevator", "Air conditioning", "Balcony", "Security", "Gym"),
                Units = new List<Unit>
                {
                    new()
                    {
                        UnitNumber = "M-303",
                        Floor = 3,
                        AreaSqm = 155.0,
                        Bedrooms = 2,
                        Bathrooms = 2,
                        MonthlyRent = 31000m,
                        DepositAmount = 31000m,
                        Status = UnitStatus.Available
                    }
                }
            },

            // 9. Dokki - Giza (Owner 2)
            new Property
            {
                OwnerProfileId = owner2.Id,
                Name = "Dokki Officers Square Flat",
                Address = "12 Mossadak Street, Dokki",
                City = "Giza",
                Description = "Prime central location in the heart of Dokki, minutes from Cairo University, Mohandessin, and Dokki metro station.",
                Images = new List<PropertyImage>
                {
                    new() { Url = "https://picsum.photos/seed/dokki1/800/600", IsPrimary = true },
                    new() { Url = "https://picsum.photos/seed/dokki2/800/600", IsPrimary = false },
                },
                PropertyAmenities = BuildAmenities("Wi-Fi", "Elevator", "Air conditioning", "Balcony"),
                Units = new List<Unit>
                {
                    new()
                    {
                        UnitNumber = "501",
                        Floor = 5,
                        AreaSqm = 135.0,
                        Bedrooms = 2,
                        Bathrooms = 1,
                        MonthlyRent = 17500m,
                        DepositAmount = 17500m,
                        Status = UnitStatus.Available
                    }
                }
            },

            // 10. Gleem Bay - Alexandria (Owner 2)
            new Property
            {
                OwnerProfileId = owner2.Id,
                Name = "Gleem Bay Mediterranean Flat",
                Address = "Corniche Road, Gleem",
                City = "Alexandria",
                Description = "Breathtaking panoramic sunset views over Gleem Bay, walking distance to coastal seafood restaurants and Alexandria's vibrant promenade.",
                Images = new List<PropertyImage>
                {
                    new() { Url = "https://picsum.photos/seed/gleem1/800/600", IsPrimary = true },
                    new() { Url = "https://picsum.photos/seed/gleem2/800/600", IsPrimary = false },
                },
                PropertyAmenities = BuildAmenities("Wi-Fi", "Parking", "Elevator", "Air conditioning", "Balcony", "Security"),
                Units = new List<Unit>
                {
                    new()
                    {
                        UnitNumber = "8C",
                        Floor = 8,
                        AreaSqm = 165.0,
                        Bedrooms = 3,
                        Bathrooms = 2,
                        MonthlyRent = 24000m,
                        DepositAmount = 24000m,
                        Status = UnitStatus.Available
                    }
                }
            },

            // 11. Allegria Golf Villa - 6th of October (Owner 2)
            new Property
            {
                OwnerProfileId = owner2.Id,
                Name = "Allegria Signature Golf Villa",
                Address = "Cairo-Alex Desert Road, KM 38",
                City = "6th of October",
                Description = "Signature Greg Norman golf course villa with infinity private pool, double-height ceilings, marble floors, and floor-to-ceiling glass.",
                Images = new List<PropertyImage>
                {
                    new() { Url = "https://picsum.photos/seed/allegria1/800/600", IsPrimary = true },
                    new() { Url = "https://picsum.photos/seed/allegria2/800/600", IsPrimary = false },
                    new() { Url = "https://picsum.photos/seed/allegria3/800/600", IsPrimary = false },
                },
                PropertyAmenities = BuildAmenities("Wi-Fi", "Parking", "Air conditioning", "Balcony", "Security", "Furnished", "Gym"),
                Units = new List<Unit>
                {
                    new()
                    {
                        UnitNumber = "V-88",
                        Floor = 1,
                        AreaSqm = 510.0,
                        Bedrooms = 5,
                        Bathrooms = 5,
                        MonthlyRent = 95000m,
                        DepositAmount = 190000m,
                        Status = UnitStatus.Available
                    }
                }
            },

            // 12. Korba Vintage Studio - Cairo (Owner 2)
            new Property
            {
                OwnerProfileId = owner2.Id,
                Name = "Korba Vintage Studio",
                Address = "Baghdad Street, El Korba, Heliopolis",
                City = "Cairo",
                Description = "Classic Baron Empain-era architectural charm in El Korba with high ceilings, decorative arches, and walking proximity to European-style cafes.",
                Images = new List<PropertyImage>
                {
                    new() { Url = "https://picsum.photos/seed/korba1/800/600", IsPrimary = true },
                    new() { Url = "https://picsum.photos/seed/korba2/800/600", IsPrimary = false },
                },
                PropertyAmenities = BuildAmenities("Wi-Fi", "Elevator", "Air conditioning", "Furnished"),
                Units = new List<Unit>
                {
                    new()
                    {
                        UnitNumber = "K-12",
                        Floor = 2,
                        AreaSqm = 55.0,
                        Bedrooms = 1,
                        Bathrooms = 1,
                        MonthlyRent = 13000m,
                        DepositAmount = 13000m,
                        Status = UnitStatus.Available
                    }
                }
            }
        };

        dbContext.Properties.AddRange(propertiesToSeed);
        await dbContext.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} properties with units and amenities.", propertiesToSeed.Count);

        return propertiesToSeed;
    }

    private static async Task<RentalContract?> SeedContractsAsync(
        RentifyDbContext dbContext,
        List<Property> properties,
        List<UserProfilePair<TenantProfile>> tenants,
        ILogger logger)
    {
        if (await dbContext.RentalContracts.AnyAsync())
        {
            logger.LogInformation("RentalContracts table already populated; retrieving active contract if present.");
            var mainTenantId = tenants[0].Profile.Id;
            return await dbContext.RentalContracts
                .Include(c => c.Unit)
                .ThenInclude(u => u!.Property)
                .FirstOrDefaultAsync(c => c.TenantProfileId == mainTenantId && c.Status == ContractStatus.Active);
        }

        logger.LogInformation("Seeding rental contracts covering all contract statuses...");

        var mainTenant = tenants[0].Profile;
        var tenant2 = tenants.Count > 1 ? tenants[1].Profile : mainTenant;
        var tenant3 = tenants.Count > 2 ? tenants[2].Profile : tenant2;

        var allUnits = properties.SelectMany(p => p.Units).ToList();
        var zamalekUnit = allUnits.First(u => u.UnitNumber == "301");
        var palmHillsUnit = allUnits.First(u => u.UnitNumber == "D-12");
        var pyramidsUnit = allUnits.First(u => u.UnitNumber == "Villa 4");
        var maadiUnit = allUnits.First(u => u.UnitNumber == "2B");
        var sanStefanoUnit = allUnits.First(u => u.UnitNumber == "12A");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // 1. Main Tenant: Active Contract (Nile Crest Zamalek Residence, Unit 301)
        var activeContract = new RentalContract
        {
            UnitId = zamalekUnit.Id,
            TenantProfileId = mainTenant.Id,
            StartDate = today.AddMonths(-3),
            EndDate = today.AddMonths(9),
            MonthlyRent = zamalekUnit.MonthlyRent,
            SecurityDeposit = zamalekUnit.DepositAmount
        };
        activeContract.Activate();

        // 2. Main Tenant: Pending Request (Palm Hills Executive Duplex, Unit D-12)
        var pendingContract = new RentalContract
        {
            UnitId = palmHillsUnit.Id,
            TenantProfileId = mainTenant.Id,
            StartDate = today.AddDays(15),
            EndDate = today.AddDays(15).AddYears(1),
            MonthlyRent = palmHillsUnit.MonthlyRent,
            SecurityDeposit = palmHillsUnit.DepositAmount
        };
        // Status remains Pending by default

        // 3. Tenant 2: Expired Contract (Pyramids Heights Villa)
        var expiredContract = new RentalContract
        {
            UnitId = pyramidsUnit.Id,
            TenantProfileId = tenant2.Id,
            StartDate = today.AddMonths(-14),
            EndDate = today.AddMonths(-2),
            MonthlyRent = pyramidsUnit.MonthlyRent,
            SecurityDeposit = pyramidsUnit.DepositAmount
        };
        expiredContract.Activate();
        expiredContract.Expire();

        // 4. Tenant 3: Cancelled / Rejected Request (Maadi Degla Greenery Flat)
        var cancelledContract = new RentalContract
        {
            UnitId = maadiUnit.Id,
            TenantProfileId = tenant3.Id,
            StartDate = today.AddMonths(-1),
            EndDate = today.AddMonths(11),
            MonthlyRent = maadiUnit.MonthlyRent,
            SecurityDeposit = maadiUnit.DepositAmount
        };
        cancelledContract.Cancel();

        // 5. Tenant 2: Terminated Contract (San Stefano Seafront Suite)
        var terminatedContract = new RentalContract
        {
            UnitId = sanStefanoUnit.Id,
            TenantProfileId = tenant2.Id,
            StartDate = today.AddMonths(-8),
            EndDate = today.AddMonths(4),
            MonthlyRent = sanStefanoUnit.MonthlyRent,
            SecurityDeposit = sanStefanoUnit.DepositAmount
        };
        terminatedContract.Activate();
        terminatedContract.Terminate();

        var contracts = new[] { activeContract, pendingContract, expiredContract, cancelledContract, terminatedContract };
        dbContext.RentalContracts.AddRange(contracts);
        await dbContext.SaveChangesAsync();

        logger.LogInformation("Seeded {Count} rental contracts across Pending, Active, Expired, Cancelled, and Terminated statuses.", contracts.Length);

        return activeContract;
    }

    private static async Task SeedPaymentsAsync(
        RentifyDbContext dbContext,
        RentalContract activeContract,
        ILogger logger)
    {
        if (await dbContext.Payments.AnyAsync(p => p.RentalContractId == activeContract.Id))
        {
            logger.LogInformation("Payments for active contract already populated; skipping payment seeding.");
            return;
        }

        logger.LogInformation("Seeding 12 monthly installments for active contract {ContractId}...", activeContract.Id);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var contractStart = activeContract.StartDate;
        var rentAmount = activeContract.MonthlyRent;
        var tenantId = activeContract.TenantProfileId;

        var payments = new List<Payment>();

        // Installment 1: 3 months ago -> Paid via BankTransfer
        var due1 = contractStart;
        var pay1 = new Payment
        {
            RentalContractId = activeContract.Id,
            TenantProfileId = tenantId,
            Amount = rentAmount,
            DueDate = due1
        };
        pay1.MarkAsPaid(PaymentMethod.BankTransfer, "BTX-20260718-881", due1.ToDateTime(new TimeOnly(11, 30), DateTimeKind.Utc));
        payments.Add(pay1);

        // Installment 2: 2 months ago -> Paid via Card
        var due2 = contractStart.AddMonths(1);
        var pay2 = new Payment
        {
            RentalContractId = activeContract.Id,
            TenantProfileId = tenantId,
            Amount = rentAmount,
            DueDate = due2
        };
        pay2.MarkAsPaid(PaymentMethod.Card, "CRD-20260818-492", due2.ToDateTime(new TimeOnly(15, 45), DateTimeKind.Utc));
        payments.Add(pay2);

        // Installment 3: 1 month ago -> Overdue (Late)
        var due3 = contractStart.AddMonths(2);
        var pay3 = new Payment
        {
            RentalContractId = activeContract.Id,
            TenantProfileId = tenantId,
            Amount = rentAmount,
            DueDate = due3
        };
        pay3.MarkAsLate();
        payments.Add(pay3);

        // Installment 4: Due soon (within 5 days)
        var due4 = today.AddDays(5);
        var pay4 = new Payment
        {
            RentalContractId = activeContract.Id,
            TenantProfileId = tenantId,
            Amount = rentAmount,
            DueDate = due4
        };
        payments.Add(pay4);

        // Installments 5..12: Upcoming future monthly payments
        for (int monthIndex = 4; monthIndex < 12; monthIndex++)
        {
            var futureDue = contractStart.AddMonths(monthIndex);
            payments.Add(new Payment
            {
                RentalContractId = activeContract.Id,
                TenantProfileId = tenantId,
                Amount = rentAmount,
                DueDate = futureDue
            });
        }

        dbContext.Payments.AddRange(payments);
        await dbContext.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} payment installments (2 paid, 1 overdue, 1 due soon, 8 upcoming).", payments.Count);
    }

    private static async Task SeedMaintenanceRequestsAsync(
        RentifyDbContext dbContext,
        RentalContract activeContract,
        string ownerUserId,
        ILogger logger)
    {
        if (await dbContext.MaintenanceRequests.AnyAsync(m => m.UnitId == activeContract.UnitId))
        {
            logger.LogInformation("Maintenance requests for active unit already populated; skipping seeding.");
            return;
        }

        logger.LogInformation("Seeding maintenance requests for unit {UnitId}...", activeContract.UnitId);

        var unitId = activeContract.UnitId;
        var tenantId = activeContract.TenantProfileId;

        // 1. Resolved request
        var req1 = new MaintenanceRequest
        {
            UnitId = unitId,
            TenantProfileId = tenantId,
            Title = "Living room AC filter cleaning and service",
            Description = "Reduced airflow and mild odor coming from the split air conditioning unit in the main reception salon.",
            Priority = MaintenancePriority.Low
        };
        req1.ChangeStatus(MaintenanceStatus.InProgress, ownerUserId, "Technician assigned and scheduled for inspection.");
        req1.ChangeStatus(MaintenanceStatus.Resolved, ownerUserId, "Filters thoroughly cleaned, indoor coils sanitized, and freon level verified.");

        // 2. In progress request
        var req2 = new MaintenanceRequest
        {
            UnitId = unitId,
            TenantProfileId = tenantId,
            Title = "Master bathroom vanity drain slow leak",
            Description = "Small amount of water accumulation noticed underneath the master bathroom vanity trap when running the faucet.",
            Priority = MaintenancePriority.Medium
        };
        req2.ChangeStatus(MaintenanceStatus.InProgress, ownerUserId, "Plumbing specialist dispatched with replacement PVC seal.");

        // 3. Open request (High priority)
        var req3 = new MaintenanceRequest
        {
            UnitId = unitId,
            TenantProfileId = tenantId,
            Title = "Balcony terrace sliding door latch sticking",
            Description = "The sliding glass door latch to the Nile view balcony does not click into locked position easily.",
            Priority = MaintenancePriority.Medium
        };

        // 4. Open request (Emergency)
        var req4 = new MaintenanceRequest
        {
            UnitId = unitId,
            TenantProfileId = tenantId,
            Title = "Water heater electrical circuit breaker trip",
            Description = "Switching on the secondary bathroom electric water heater occasionally trips the sub-panel breaker.",
            Priority = MaintenancePriority.Emergency
        };

        var requests = new[] { req1, req2, req3, req4 };
        dbContext.MaintenanceRequests.AddRange(requests);
        await dbContext.SaveChangesAsync();

        logger.LogInformation("Seeded {Count} maintenance requests across Open, InProgress, and Resolved statuses.", requests.Length);
    }
}
