using SufraWahda.Domain.Common;
using SufraWahda.Domain.Enums;
using SufraWahda.Domain.Events;

namespace SufraWahda.Domain.Entities;

// ─── User ────────────────────────────────────────────────────────────────────
public class User : BaseEntity
{
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? Email { get; set; }
    public string PasswordHash { get; set; } = default!;
    public UserRole Role { get; set; } = UserRole.Customer;
    public UserStatus Status { get; set; } = UserStatus.PendingVerification;
    public string? ProfileImageUrl { get; set; }
    public bool IsPhoneVerified { get; set; }
    public bool IsEmailVerified { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string Language { get; set; } = "ar";
    public int LoyaltyPoints { get; set; }
    public string? ReferralCode { get; set; }
    public Guid? ReferredBy { get; set; }
    public DateTime? LastLoginAt { get; set; }

    // Navigation
    public ICollection<Address> Addresses { get; set; } = new List<Address>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<FavoriteRestaurant> FavoriteRestaurants { get; set; } = new List<FavoriteRestaurant>();
    public DriverProfile? DriverProfile { get; set; }
}

// ─── RefreshToken ─────────────────────────────────────────────────────────────
public class RefreshToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Token { get; set; } = default!;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public User User { get; set; } = default!;

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => !IsRevoked && !IsExpired;
}

// ─── PhoneVerification ────────────────────────────────────────────────────────
public class PhoneVerification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Phone { get; set; } = default!;
    public string Code { get; set; } = default!;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public int Attempts { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsValid => !IsUsed && !IsExpired && Attempts < 5;
}

// ─── Address ──────────────────────────────────────────────────────────────────
public class Address : BaseEntity
{
    public Guid UserId { get; set; }
    public string? Label { get; set; }
    public string AddressLine1 { get; set; } = default!;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = "المنيا";
    public string Governorate { get; set; } = "المنيا";
    public string? Landmark { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool IsDefault { get; set; }
    public User User { get; set; } = default!;
}

// ─── RestaurantCategory ───────────────────────────────────────────────────────
public class RestaurantCategory : BaseEntity
{
    public string NameAr { get; set; } = default!;
    public string? NameEn { get; set; }
    public string? IconUrl { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<Restaurant> Restaurants { get; set; } = new List<Restaurant>();
}

// ─── Restaurant ───────────────────────────────────────────────────────────────
public class Restaurant : BaseEntity
{
    public Guid OwnerId { get; set; }
    public string NameAr { get; set; } = default!;
    public string? NameEn { get; set; }
    public string? DescriptionAr { get; set; }
    public string? DescriptionEn { get; set; }
    public string? LogoUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public Guid? CategoryId { get; set; }
    public string Phone { get; set; } = default!;
    public string? Email { get; set; }
    public string Address { get; set; } = default!;
    public string City { get; set; } = "المنيا";
    public string Governorate { get; set; } = "المنيا";
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public RestaurantStatus Status { get; set; } = RestaurantStatus.PendingApproval;
    public bool IsOpen { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsSponsored { get; set; }
    public DateTime? SponsorExpiresAt { get; set; }
    public decimal MinOrderAmount { get; set; }
    public decimal DeliveryFee { get; set; }
    public int EstimatedDeliveryMinutes { get; set; } = 45;
    public decimal MaxDeliveryRadiusKm { get; set; } = 10;
    public decimal CommissionPercentage { get; set; } = 15;
    public string? TaxId { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankName { get; set; }
    public decimal AverageRating { get; set; }
    public int TotalRatings { get; set; }
    public int TotalOrders { get; set; }
    public string? OpeningHoursJson { get; set; }
    public string[]? Tags { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public Guid? ApprovedBy { get; set; }

    // Navigation
    public User Owner { get; set; } = default!;
    public RestaurantCategory? Category { get; set; }
    public ICollection<MenuCategory> MenuCategories { get; set; } = new List<MenuCategory>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<RestaurantReview> Reviews { get; set; } = new List<RestaurantReview>();
    public ICollection<RestaurantImage> Images { get; set; } = new List<RestaurantImage>();

    public void Approve(Guid adminId)
    {
        Status = RestaurantStatus.Active;
        ApprovedAt = DateTime.UtcNow;
        ApprovedBy = adminId;
        AddDomainEvent(new RestaurantApprovedEvent(Id));
    }

    public void Reject(string reason)
    {
        Status = RestaurantStatus.PendingApproval;
        RejectionReason = reason;
    }

    public void UpdateRating(decimal newRating)
    {
        var totalScore = AverageRating * TotalRatings + newRating;
        TotalRatings++;
        AverageRating = Math.Round(totalScore / TotalRatings, 2);
    }
}

// ─── RestaurantImage ─────────────────────────────────────────────────────────
public class RestaurantImage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RestaurantId { get; set; }
    public string ImageUrl { get; set; } = default!;
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Restaurant Restaurant { get; set; } = default!;
}

// ─── MenuCategory ─────────────────────────────────────────────────────────────
public class MenuCategory : BaseEntity
{
    public Guid RestaurantId { get; set; }
    public string NameAr { get; set; } = default!;
    public string? NameEn { get; set; }
    public string? DescriptionAr { get; set; }
    public string? ImageUrl { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public Restaurant Restaurant { get; set; } = default!;
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

// ─── Product ──────────────────────────────────────────────────────────────────
public class Product : BaseEntity
{
    public Guid RestaurantId { get; set; }
    public Guid MenuCategoryId { get; set; }
    public string NameAr { get; set; } = default!;
    public string? NameEn { get; set; }
    public string? DescriptionAr { get; set; }
    public string? DescriptionEn { get; set; }
    public string? ImageUrl { get; set; }
    public decimal BasePrice { get; set; }
    public decimal? DiscountedPrice { get; set; }
    public int? Calories { get; set; }
    public bool IsAvailable { get; set; } = true;
    public bool IsFeatured { get; set; }
    public int PreparationMinutes { get; set; } = 15;
    public string[]? Tags { get; set; }
    public int DisplayOrder { get; set; }
    public int TotalOrders { get; set; }
    public decimal AverageRating { get; set; }

    public decimal EffectivePrice => DiscountedPrice ?? BasePrice;

    // Navigation
    public Restaurant Restaurant { get; set; } = default!;
    public MenuCategory MenuCategory { get; set; } = default!;
    public ICollection<ProductOption> Options { get; set; } = new List<ProductOption>();
}

// ─── ProductOption ────────────────────────────────────────────────────────────
public class ProductOption
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public string NameAr { get; set; } = default!;
    public string? NameEn { get; set; }
    public bool IsRequired { get; set; }
    public int MinSelections { get; set; }
    public int MaxSelections { get; set; } = 1;
    public int DisplayOrder { get; set; }
    public Product Product { get; set; } = default!;
    public ICollection<ProductOptionValue> Values { get; set; } = new List<ProductOptionValue>();
}

// ─── ProductOptionValue ───────────────────────────────────────────────────────
public class ProductOptionValue
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OptionId { get; set; }
    public string NameAr { get; set; } = default!;
    public string? NameEn { get; set; }
    public decimal AdditionalPrice { get; set; }
    public bool IsDefault { get; set; }
    public ProductOption Option { get; set; } = default!;
}

// ─── Order ────────────────────────────────────────────────────────────────────
public class Order : BaseEntity
{
    public string OrderNumber { get; set; } = default!;
    public Guid CustomerId { get; set; }
    public Guid RestaurantId { get; set; }
    public Guid? DriverId { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public PaymentMethod PaymentMethod { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public string? PaymentReference { get; set; }
    public decimal Subtotal { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public Guid? CouponId { get; set; }
    public int LoyaltyPointsUsed { get; set; }
    public int LoyaltyPointsEarned { get; set; }
    public string DeliveryAddress { get; set; } = default!;
    public decimal? DeliveryLatitude { get; set; }
    public decimal? DeliveryLongitude { get; set; }
    public string? DeliveryNotes { get; set; }
    public string? CustomerNotes { get; set; }
    public string? RestaurantNotes { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? EstimatedDeliveryAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? PreparedAt { get; set; }
    public DateTime? PickedUpAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    // Navigation
    public User Customer { get; set; } = default!;
    public Restaurant Restaurant { get; set; } = default!;
    public User? Driver { get; set; }
    public Coupon? Coupon { get; set; }
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public ICollection<OrderStatusHistory> StatusHistory { get; set; } = new List<OrderStatusHistory>();
    public Delivery? Delivery { get; set; }

    public void UpdateStatus(OrderStatus newStatus, Guid? changedBy = null, string? notes = null)
    {
        var history = new OrderStatusHistory
        {
            OrderId = Id,
            Status = newStatus,
            ChangedBy = changedBy,
            Notes = notes
        };
        StatusHistory.Add(history);
        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;

        switch (newStatus)
        {
            case OrderStatus.Confirmed: ConfirmedAt = DateTime.UtcNow; break;
            case OrderStatus.ReadyForPickup: PreparedAt = DateTime.UtcNow; break;
            case OrderStatus.PickedUp: PickedUpAt = DateTime.UtcNow; break;
            case OrderStatus.Delivered: DeliveredAt = DateTime.UtcNow; break;
            case OrderStatus.Cancelled: CancelledAt = DateTime.UtcNow; break;
        }

        AddDomainEvent(new OrderStatusChangedEvent(Id, newStatus));
    }
}

// ─── OrderItem ────────────────────────────────────────────────────────────────
public class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductNameAr { get; set; } = default!;
    public string? ProductImageUrl { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public string? SelectedOptionsJson { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Order Order { get; set; } = default!;
    public Product Product { get; set; } = default!;
}

// ─── OrderStatusHistory ───────────────────────────────────────────────────────
public class OrderStatusHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public OrderStatus Status { get; set; }
    public Guid? ChangedBy { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Order Order { get; set; } = default!;
}

// ─── DriverProfile ────────────────────────────────────────────────────────────
public class DriverProfile : BaseEntity
{
    public Guid UserId { get; set; }
    public string? NationalId { get; set; }
    public string? NationalIdImageUrl { get; set; }
    public string? VehicleType { get; set; }
    public string? VehiclePlate { get; set; }
    public string? LicenseImageUrl { get; set; }
    public DriverStatus Status { get; set; } = DriverStatus.PendingVerification;
    public decimal? CurrentLatitude { get; set; }
    public decimal? CurrentLongitude { get; set; }
    public DateTime? LastLocationUpdate { get; set; }
    public bool IsOnline { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankName { get; set; }
    public string? RejectionReason { get; set; }
    public int TotalDeliveries { get; set; }
    public decimal AverageRating { get; set; }
    public User User { get; set; } = default!;
}

// ─── Delivery ─────────────────────────────────────────────────────────────────
public class Delivery : BaseEntity
{
    public Guid OrderId { get; set; }
    public Guid DriverId { get; set; }
    public DeliveryStatus Status { get; set; } = DeliveryStatus.Assigned;
    public decimal? PickupLatitude { get; set; }
    public decimal? PickupLongitude { get; set; }
    public decimal? DeliveryLatitude { get; set; }
    public decimal? DeliveryLongitude { get; set; }
    public decimal? DistanceKm { get; set; }
    public decimal? DriverEarnings { get; set; }
    public DateTime? PickedUpAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public Order Order { get; set; } = default!;
    public User Driver { get; set; } = default!;
}

// ─── Coupon ───────────────────────────────────────────────────────────────────
public class Coupon : BaseEntity
{
    public string Code { get; set; } = default!;
    public CouponType Type { get; set; }
    public decimal Value { get; set; }
    public decimal MinOrderAmount { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public Guid? RestaurantId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int? MaxUses { get; set; }
    public int MaxUsesPerUser { get; set; } = 1;
    public int UsedCount { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid? CreatedBy { get; set; }
    public Restaurant? Restaurant { get; set; }

    public bool IsValid => IsActive
        && DateTime.UtcNow >= StartDate
        && DateTime.UtcNow <= EndDate
        && (!MaxUses.HasValue || UsedCount < MaxUses.Value);

    public decimal CalculateDiscount(decimal orderAmount)
    {
        if (!IsValid || orderAmount < MinOrderAmount) return 0;
        var discount = Type switch
        {
            CouponType.Percentage => orderAmount * Value / 100,
            CouponType.FixedAmount => Value,
            CouponType.FreeDelivery => 0, // handled separately
            _ => 0
        };
        if (MaxDiscountAmount.HasValue)
            discount = Math.Min(discount, MaxDiscountAmount.Value);
        return Math.Min(discount, orderAmount);
    }
}

// ─── RestaurantReview ─────────────────────────────────────────────────────────
public class RestaurantReview : BaseEntity
{
    public Guid CustomerId { get; set; }
    public Guid RestaurantId { get; set; }
    public Guid OrderId { get; set; }
    public decimal FoodRating { get; set; }
    public decimal? DeliveryRating { get; set; }
    public decimal OverallRating { get; set; }
    public string? Comment { get; set; }
    public string[]? Images { get; set; }
    public bool IsVisible { get; set; } = true;
    public string? RestaurantReply { get; set; }
    public DateTime? RepliedAt { get; set; }
    public User Customer { get; set; } = default!;
    public Restaurant Restaurant { get; set; } = default!;
}

// ─── FavoriteRestaurant ───────────────────────────────────────────────────────
public class FavoriteRestaurant
{
    public Guid UserId { get; set; }
    public Guid RestaurantId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public User User { get; set; } = default!;
    public Restaurant Restaurant { get; set; } = default!;
}

// ─── Notification ─────────────────────────────────────────────────────────────
public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public NotificationType Type { get; set; }
    public string TitleAr { get; set; } = default!;
    public string BodyAr { get; set; } = default!;
    public string? DataJson { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public User User { get; set; } = default!;
}

// ─── Advertisement ────────────────────────────────────────────────────────────
public class Advertisement : BaseEntity
{
    public string TitleAr { get; set; } = default!;
    public string ImageUrl { get; set; } = default!;
    public string? LinkUrl { get; set; }
    public Guid? RestaurantId { get; set; }
    public AdPosition Position { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Impressions { get; set; }
    public int Clicks { get; set; }
    public bool IsActive { get; set; } = true;
    public Restaurant? Restaurant { get; set; }

    public bool IsCurrentlyActive => IsActive
        && DateTime.UtcNow >= StartDate
        && DateTime.UtcNow <= EndDate;
}

// ─── DeliveryZone ─────────────────────────────────────────────────────────────
public class DeliveryZone : BaseEntity
{
    public string NameAr { get; set; } = default!;
    public string City { get; set; } = "المنيا";
    public string PolygonCoordinatesJson { get; set; } = "[]";
    public decimal BaseDeliveryFee { get; set; } = 5;
    public decimal FeePerKm { get; set; } = 1.5m;
    public bool IsActive { get; set; } = true;
}

// ─── PlatformSetting ──────────────────────────────────────────────────────────
public class PlatformSetting
{
    public string Key { get; set; } = default!;
    public string Value { get; set; } = default!;
    public string? Description { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid? UpdatedBy { get; set; }
}
