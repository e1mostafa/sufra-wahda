using SufraWahda.Domain.Common;
using SufraWahda.Domain.Entities;
using SufraWahda.Domain.Enums;
using System.Linq.Expressions;

namespace SufraWahda.Domain.Interfaces;

// ─── Generic Repository ───────────────────────────────────────────────────────
public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default);
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
    Task<T> AddAsync(T entity, CancellationToken ct = default);
    Task UpdateAsync(T entity, CancellationToken ct = default);
    Task DeleteAsync(T entity, CancellationToken ct = default);
    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken ct = default);
}

// ─── Unit of Work ─────────────────────────────────────────────────────────────
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
    Task BeginTransactionAsync(CancellationToken ct = default);
    Task CommitTransactionAsync(CancellationToken ct = default);
    Task RollbackTransactionAsync(CancellationToken ct = default);
}

// ─── User Repository ──────────────────────────────────────────────────────────
public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByPhoneAsync(string phone, CancellationToken ct = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<User?> GetByReferralCodeAsync(string code, CancellationToken ct = default);
    Task<bool> PhoneExistsAsync(string phone, CancellationToken ct = default);
}

// ─── Restaurant Repository ────────────────────────────────────────────────────
public interface IRestaurantRepository : IRepository<Restaurant>
{
    Task<(IEnumerable<Restaurant> Items, int Total)> GetPagedAsync(
        int page, int pageSize, string? search = null,
        Guid? categoryId = null, string? city = null,
        bool? isOpen = null, bool? isFeatured = null,
        CancellationToken ct = default);

    Task<IEnumerable<Restaurant>> GetNearbyAsync(
        decimal lat, decimal lng, double radiusKm,
        int limit = 20, CancellationToken ct = default);

    Task<IEnumerable<Restaurant>> GetFeaturedAsync(int limit = 10, CancellationToken ct = default);
    Task<IEnumerable<Restaurant>> GetSponsoredAsync(int limit = 5, CancellationToken ct = default);
    Task<IEnumerable<Restaurant>> GetPendingApprovalAsync(CancellationToken ct = default);
    Task<Restaurant?> GetWithMenuAsync(Guid id, CancellationToken ct = default);
    Task<Restaurant?> GetByOwnerAsync(Guid ownerId, CancellationToken ct = default);
}

// ─── Order Repository ─────────────────────────────────────────────────────────
public interface IOrderRepository : IRepository<Order>
{
    Task<Order?> GetByOrderNumberAsync(string orderNumber, CancellationToken ct = default);
    Task<Order?> GetWithDetailsAsync(Guid id, CancellationToken ct = default);

    Task<(IEnumerable<Order> Items, int Total)> GetByCustomerAsync(
        Guid customerId, int page, int pageSize, CancellationToken ct = default);

    Task<(IEnumerable<Order> Items, int Total)> GetByRestaurantAsync(
        Guid restaurantId, int page, int pageSize,
        OrderStatus? status = null, CancellationToken ct = default);

    Task<IEnumerable<Order>> GetActiveByRestaurantAsync(Guid restaurantId, CancellationToken ct = default);
    Task<string> GenerateOrderNumberAsync(CancellationToken ct = default);

    Task<(decimal Revenue, int Count)> GetRevenueAsync(
        Guid restaurantId, DateTime from, DateTime to, CancellationToken ct = default);
}

// ─── Product Repository ───────────────────────────────────────────────────────
public interface IProductRepository : IRepository<Product>
{
    Task<IEnumerable<Product>> GetByRestaurantAsync(Guid restaurantId, CancellationToken ct = default);
    Task<IEnumerable<Product>> GetByCategoryAsync(Guid menuCategoryId, CancellationToken ct = default);
    Task<IEnumerable<Product>> SearchAsync(string query, Guid? restaurantId = null, CancellationToken ct = default);
}

// ─── Coupon Repository ────────────────────────────────────────────────────────
public interface ICouponRepository : IRepository<Coupon>
{
    Task<Coupon?> GetByCodeAsync(string code, CancellationToken ct = default);
    Task<int> GetUserUsageCountAsync(Guid couponId, Guid userId, CancellationToken ct = default);
}

// ─── Notification Repository ──────────────────────────────────────────────────
public interface INotificationRepository : IRepository<Notification>
{
    Task<(IEnumerable<Notification> Items, int Total)> GetByUserAsync(
        Guid userId, int page, int pageSize, CancellationToken ct = default);
    Task MarkAllReadAsync(Guid userId, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default);
}
