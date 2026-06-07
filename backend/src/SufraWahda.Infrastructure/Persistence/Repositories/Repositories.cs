using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SufraWahda.Domain.Common;
using SufraWahda.Domain.Entities;
using SufraWahda.Domain.Enums;
using SufraWahda.Domain.Interfaces;
using System.Linq.Expressions;

namespace SufraWahda.Infrastructure.Persistence.Repositories;

// ─── Generic Repository ───────────────────────────────────────────────────────
public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly ApplicationDbContext _db;
    protected readonly DbSet<T> _set;

    public Repository(ApplicationDbContext db)
    {
        _db = db;
        _set = db.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _set.FindAsync(new object[] { id }, ct);

    public virtual async Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default)
        => await _set.ToListAsync(ct);

    public virtual async Task<IEnumerable<T>> FindAsync(
        Expression<Func<T, bool>> predicate, CancellationToken ct = default)
        => await _set.Where(predicate).ToListAsync(ct);

    public virtual async Task<T> AddAsync(T entity, CancellationToken ct = default)
    {
        await _set.AddAsync(entity, ct);
        return entity;
    }

    public virtual Task UpdateAsync(T entity, CancellationToken ct = default)
    {
        _set.Update(entity);
        return Task.CompletedTask;
    }

    public virtual Task DeleteAsync(T entity, CancellationToken ct = default)
    {
        entity.DeletedAt = DateTime.UtcNow;
        _set.Update(entity);
        return Task.CompletedTask;
    }

    public virtual async Task<bool> ExistsAsync(
        Expression<Func<T, bool>> predicate, CancellationToken ct = default)
        => await _set.AnyAsync(predicate, ct);

    public virtual async Task<int> CountAsync(
        Expression<Func<T, bool>>? predicate = null, CancellationToken ct = default)
        => predicate == null
            ? await _set.CountAsync(ct)
            : await _set.CountAsync(predicate, ct);
}

// ─── Unit of Work ─────────────────────────────────────────────────────────────
public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _db;
    private IDbContextTransaction? _transaction;

    public UnitOfWork(ApplicationDbContext db) => _db = db;

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);

    public async Task BeginTransactionAsync(CancellationToken ct = default)
        => _transaction = await _db.Database.BeginTransactionAsync(ct);

    public async Task CommitTransactionAsync(CancellationToken ct = default)
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync(ct);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken ct = default)
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync(ct);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }
}

// ─── User Repository ──────────────────────────────────────────────────────────
public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext db) : base(db) { }

    public Task<User?> GetByPhoneAsync(string phone, CancellationToken ct = default)
        => _db.Users
            .Include(u => u.RefreshTokens)
            .Include(u => u.DriverProfile)
            .FirstOrDefaultAsync(u => u.Phone == phone, ct);

    public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
        => _db.Users.FirstOrDefaultAsync(u => u.Email == email.ToLower(), ct);

    public Task<User?> GetByReferralCodeAsync(string code, CancellationToken ct = default)
        => _db.Users.FirstOrDefaultAsync(u => u.ReferralCode == code, ct);

    public Task<bool> PhoneExistsAsync(string phone, CancellationToken ct = default)
        => _db.Users.AnyAsync(u => u.Phone == phone, ct);
}

// ─── Restaurant Repository ────────────────────────────────────────────────────
public class RestaurantRepository : Repository<Restaurant>, IRestaurantRepository
{
    public RestaurantRepository(ApplicationDbContext db) : base(db) { }

    public async Task<(IEnumerable<Restaurant> Items, int Total)> GetPagedAsync(
        int page, int pageSize, string? search = null,
        Guid? categoryId = null, string? city = null,
        bool? isOpen = null, bool? isFeatured = null,
        CancellationToken ct = default)
    {
        var q = _db.Restaurants
            .Include(r => r.Category)
            .Where(r => r.Status == RestaurantStatus.Active)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(r => EF.Functions.Like(r.NameAr, $"%{search}%")
                          || (r.NameEn != null && EF.Functions.Like(r.NameEn, $"%{search}%")));

        if (categoryId.HasValue)
            q = q.Where(r => r.CategoryId == categoryId);

        if (!string.IsNullOrWhiteSpace(city))
            q = q.Where(r => r.City == city);

        if (isOpen.HasValue)
            q = q.Where(r => r.IsOpen == isOpen);

        if (isFeatured.HasValue)
            q = q.Where(r => r.IsFeatured == isFeatured);

        // Sponsored first, then featured, then by rating
        q = q.OrderByDescending(r => r.IsSponsored)
             .ThenByDescending(r => r.IsFeatured)
             .ThenByDescending(r => r.AverageRating);

        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task<IEnumerable<Restaurant>> GetNearbyAsync(
        decimal lat, decimal lng, double radiusKm, int limit = 20, CancellationToken ct = default)
    {
        // Simple bounding box approximation (1 degree ≈ 111km)
        var latDelta = (decimal)(radiusKm / 111.0);
        var lngDelta = (decimal)(radiusKm / (111.0 * Math.Cos((double)lat * Math.PI / 180)));

        return await _db.Restaurants
            .Include(r => r.Category)
            .Where(r => r.Status == RestaurantStatus.Active
                && r.Latitude >= lat - latDelta && r.Latitude <= lat + latDelta
                && r.Longitude >= lng - lngDelta && r.Longitude <= lng + lngDelta)
            .OrderByDescending(r => r.AverageRating)
            .Take(limit)
            .ToListAsync(ct);
    }

    public Task<IEnumerable<Restaurant>> GetFeaturedAsync(int limit = 10, CancellationToken ct = default)
        => _db.Restaurants
            .Include(r => r.Category)
            .Where(r => r.Status == RestaurantStatus.Active && r.IsFeatured && r.IsOpen)
            .OrderByDescending(r => r.AverageRating)
            .Take(limit)
            .ToListAsync(ct)
            .ContinueWith(t => (IEnumerable<Restaurant>)t.Result, ct);

    public Task<IEnumerable<Restaurant>> GetSponsoredAsync(int limit = 5, CancellationToken ct = default)
        => _db.Restaurants
            .Include(r => r.Category)
            .Where(r => r.Status == RestaurantStatus.Active
                && r.IsSponsored
                && (r.SponsorExpiresAt == null || r.SponsorExpiresAt > DateTime.UtcNow))
            .Take(limit)
            .ToListAsync(ct)
            .ContinueWith(t => (IEnumerable<Restaurant>)t.Result, ct);

    public Task<IEnumerable<Restaurant>> GetPendingApprovalAsync(CancellationToken ct = default)
        => _db.Restaurants
            .IgnoreQueryFilters()
            .Include(r => r.Owner)
            .Where(r => r.Status == RestaurantStatus.PendingApproval)
            .OrderBy(r => r.CreatedAt)
            .ToListAsync(ct)
            .ContinueWith(t => (IEnumerable<Restaurant>)t.Result, ct);

    public Task<Restaurant?> GetWithMenuAsync(Guid id, CancellationToken ct = default)
        => _db.Restaurants
            .Include(r => r.Category)
            .Include(r => r.Images)
            .Include(r => r.MenuCategories.Where(c => c.IsActive))
                .ThenInclude(c => c.Products.Where(p => p.IsAvailable && p.DeletedAt == null))
                    .ThenInclude(p => p.Options)
                        .ThenInclude(o => o.Values)
            .FirstOrDefaultAsync(r => r.Id == id, ct);

    public Task<Restaurant?> GetByOwnerAsync(Guid ownerId, CancellationToken ct = default)
        => _db.Restaurants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(r => r.OwnerId == ownerId, ct);
}

// ─── Order Repository ─────────────────────────────────────────────────────────
public class OrderRepository : Repository<Order>, IOrderRepository
{
    public OrderRepository(ApplicationDbContext db) : base(db) { }

    public Task<Order?> GetByOrderNumberAsync(string orderNumber, CancellationToken ct = default)
        => _db.Orders.FirstOrDefaultAsync(o => o.OrderNumber == orderNumber, ct);

    public Task<Order?> GetWithDetailsAsync(Guid id, CancellationToken ct = default)
        => _db.Orders
            .Include(o => o.Customer)
            .Include(o => o.Restaurant).ThenInclude(r => r.Owner)
            .Include(o => o.Driver).ThenInclude(d => d!.DriverProfile)
            .Include(o => o.Items).ThenInclude(i => i.Product)
            .Include(o => o.StatusHistory.OrderBy(h => h.CreatedAt))
            .Include(o => o.Delivery)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

    public async Task<(IEnumerable<Order> Items, int Total)> GetByCustomerAsync(
        Guid customerId, int page, int pageSize, CancellationToken ct = default)
    {
        var q = _db.Orders
            .Include(o => o.Restaurant)
            .Include(o => o.Items)
            .Where(o => o.CustomerId == customerId)
            .OrderByDescending(o => o.CreatedAt);

        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task<(IEnumerable<Order> Items, int Total)> GetByRestaurantAsync(
        Guid restaurantId, int page, int pageSize,
        OrderStatus? status = null, CancellationToken ct = default)
    {
        var q = _db.Orders
            .Include(o => o.Customer)
            .Include(o => o.Items)
            .Where(o => o.RestaurantId == restaurantId);

        if (status.HasValue) q = q.Where(o => o.Status == status);

        q = q.OrderByDescending(o => o.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public Task<IEnumerable<Order>> GetActiveByRestaurantAsync(Guid restaurantId, CancellationToken ct = default)
        => _db.Orders
            .Include(o => o.Customer)
            .Include(o => o.Items).ThenInclude(i => i.Product)
            .Where(o => o.RestaurantId == restaurantId
                && o.Status != OrderStatus.Delivered
                && o.Status != OrderStatus.Cancelled
                && o.Status != OrderStatus.Refunded)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(ct)
            .ContinueWith(t => (IEnumerable<Order>)t.Result, ct);

    public async Task<string> GenerateOrderNumberAsync(CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.ToString("yyMMdd");
        var count = await _db.Orders
            .CountAsync(o => o.CreatedAt.Date == DateTime.UtcNow.Date, ct);
        return $"SW{today}{(count + 1):D4}";
    }

    public async Task<(decimal Revenue, int Count)> GetRevenueAsync(
        Guid restaurantId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        var result = await _db.Orders
            .Where(o => o.RestaurantId == restaurantId
                && o.Status == OrderStatus.Delivered
                && o.CreatedAt >= from && o.CreatedAt < to)
            .GroupBy(o => 1)
            .Select(g => new { Revenue = g.Sum(o => o.TotalAmount), Count = g.Count() })
            .FirstOrDefaultAsync(ct);

        return result == null ? (0, 0) : (result.Revenue, result.Count);
    }
}

// ─── Product Repository ───────────────────────────────────────────────────────
public class ProductRepository : Repository<Product>, IProductRepository
{
    public ProductRepository(ApplicationDbContext db) : base(db) { }

    public Task<IEnumerable<Product>> GetByRestaurantAsync(Guid restaurantId, CancellationToken ct = default)
        => _db.Products
            .Include(p => p.Options).ThenInclude(o => o.Values)
            .Where(p => p.RestaurantId == restaurantId)
            .OrderBy(p => p.DisplayOrder)
            .ToListAsync(ct)
            .ContinueWith(t => (IEnumerable<Product>)t.Result, ct);

    public Task<IEnumerable<Product>> GetByCategoryAsync(Guid menuCategoryId, CancellationToken ct = default)
        => _db.Products
            .Include(p => p.Options).ThenInclude(o => o.Values)
            .Where(p => p.MenuCategoryId == menuCategoryId && p.IsAvailable)
            .OrderBy(p => p.DisplayOrder)
            .ToListAsync(ct)
            .ContinueWith(t => (IEnumerable<Product>)t.Result, ct);

    public Task<IEnumerable<Product>> SearchAsync(string query, Guid? restaurantId = null, CancellationToken ct = default)
        => _db.Products
            .Where(p => EF.Functions.Like(p.NameAr, $"%{query}%")
                && (!restaurantId.HasValue || p.RestaurantId == restaurantId)
                && p.IsAvailable)
            .ToListAsync(ct)
            .ContinueWith(t => (IEnumerable<Product>)t.Result, ct);
}

// ─── Coupon Repository ────────────────────────────────────────────────────────
public class CouponRepository : Repository<Coupon>, ICouponRepository
{
    public CouponRepository(ApplicationDbContext db) : base(db) { }

    public Task<Coupon?> GetByCodeAsync(string code, CancellationToken ct = default)
        => _db.Coupons.FirstOrDefaultAsync(c => c.Code == code.ToUpper(), ct);

    public Task<int> GetUserUsageCountAsync(Guid couponId, Guid userId, CancellationToken ct = default)
        => _db.Orders.CountAsync(o => o.CouponId == couponId && o.CustomerId == userId, ct);
}

// ─── Notification Repository ──────────────────────────────────────────────────
public class NotificationRepository : Repository<Notification>, INotificationRepository
{
    public NotificationRepository(ApplicationDbContext db) : base(db) { }

    public async Task<(IEnumerable<Notification> Items, int Total)> GetByUserAsync(
        Guid userId, int page, int pageSize, CancellationToken ct = default)
    {
        var q = _db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt);

        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public Task MarkAllReadAsync(Guid userId, CancellationToken ct = default)
        => _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.ReadAt, DateTime.UtcNow), ct);

    public Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default)
        => _db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead, ct);
}
