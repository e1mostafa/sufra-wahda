using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;
using SufraWahda.Application.Common.Interfaces;
using SufraWahda.Domain.Interfaces;
using SufraWahda.Infrastructure.Persistence;
using SufraWahda.Infrastructure.Persistence.Repositories;
using SufraWahda.Infrastructure.Services;

namespace SufraWahda.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, IConfiguration config)
    {
        // ─── Database ─────────────────────────────────────────────────────────
        services.AddDbContext<ApplicationDbContext>(opts =>
            opts.UseNpgsql(
                config.GetConnectionString("DefaultConnection"),
                npgsql =>
                {
                    npgsql.CommandTimeout(30);
                    npgsql.EnableRetryOnFailure(3);
                })
            .UseSnakeCaseNamingConvention());

        // ─── Redis ────────────────────────────────────────────────────────────
        var redisConn = config.GetConnectionString("Redis");
        if (!string.IsNullOrEmpty(redisConn))
        {
            services.AddSingleton<IConnectionMultiplexer>(
                ConnectionMultiplexer.Connect(redisConn));
            services.AddScoped<ICacheService, RedisCacheService>();
        }
        else
        {
            services.AddScoped<ICacheService, InMemoryCacheService>();
        }

        // ─── Repositories ─────────────────────────────────────────────────────
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRestaurantRepository, RestaurantRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<ICouponRepository, CouponRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();

        // ─── HTTP Context ─────────────────────────────────────────────────────
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        // ─── JWT ──────────────────────────────────────────────────────────────
        services.AddSingleton<IJwtService, JwtService>();

        // ─── Storage ──────────────────────────────────────────────────────────
        services.AddScoped<IStorageService, CloudinaryStorageService>();

        // ─── External HTTP Services ───────────────────────────────────────────
        services.AddHttpClient<ISmsService, VonageSmsService>();
        services.AddHttpClient<IEmailService, SendGridEmailService>();
        services.AddHttpClient<IPushNotificationService, FirebasePushService>();
        services.AddHttpClient<IPaymentService, PaymentService>();
        services.AddHttpClient<IMapsService, GoogleMapsService>();

        // ─── Realtime ─────────────────────────────────────────────────────────
        services.AddScoped<IRealtimeService, SignalRRealtimeService>();

        return services;
    }
}

// ─── In-Memory Cache Fallback (dev without Redis) ─────────────────────────────
public class InMemoryCacheService : ICacheService
{
    private readonly Microsoft.Extensions.Caching.Memory.IMemoryCache _cache;
    public InMemoryCacheService(Microsoft.Extensions.Caching.Memory.IMemoryCache cache)
        => _cache = cache;

    public Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        _cache.TryGetValue(key, out object? cached);
        return Task.FromResult(cached is T val ? val : default);
    }

    public Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default)
    {
    var options = new Microsoft.Extensions.Caching.Memory.MemoryCacheEntryOptions
      {
        AbsoluteExpirationRelativeToNow = expiry ?? TimeSpan.FromHours(1)
       };
    _cache.Set(key, (object?)value, options);
    return Task.CompletedTask;
   }

    public Task RemoveAsync(string key, CancellationToken ct = default)
    {
        _cache.Remove(key);
        return Task.CompletedTask;
    }

    public Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default)
        => Task.CompletedTask; // Memory cache doesn't support prefix delete easily
}
