using SufraWahda.Domain.Enums;

namespace SufraWahda.Application.DTOs;

// ─── Auth DTOs ────────────────────────────────────────────────────────────────
public record RegisterRequest(
    string FullName,
    string Phone,
    string Password,
    string? Email = null,
    string? ReferralCode = null);

public record LoginRequest(string Phone, string Password);

public record SendOtpRequest(string Phone);

public record VerifyOtpRequest(string Phone, string Code);

public record RefreshTokenRequest(string RefreshToken);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User);

// ─── User DTOs ────────────────────────────────────────────────────────────────
public record UserDto(
    Guid Id,
    string FullName,
    string Phone,
    string? Email,
    string? ProfileImageUrl,
    UserRole Role,
    int LoyaltyPoints,
    string? ReferralCode,
    bool IsPhoneVerified);

public record UpdateProfileRequest(
    string FullName,
    string? Email,
    string? Gender,
    DateOnly? DateOfBirth);

// ─── Restaurant DTOs ──────────────────────────────────────────────────────────
public record RestaurantSummaryDto(
    Guid Id,
    string NameAr,
    string? NameEn,
    string? LogoUrl,
    string? CoverImageUrl,
    string? CategoryName,
    decimal AverageRating,
    int TotalRatings,
    decimal DeliveryFee,
    int EstimatedDeliveryMinutes,
    bool IsOpen,
    bool IsFeatured,
    bool IsSponsored,
    decimal MinOrderAmount,
    string[]? Tags,
    bool IsFavorite = false);

public record RestaurantDetailDto(
    Guid Id,
    string NameAr,
    string? NameEn,
    string? DescriptionAr,
    string? LogoUrl,
    string? CoverImageUrl,
    string Phone,
    string Address,
    string City,
    decimal AverageRating,
    int TotalRatings,
    int TotalOrders,
    decimal DeliveryFee,
    int EstimatedDeliveryMinutes,
    decimal MinOrderAmount,
    decimal MaxDeliveryRadiusKm,
    bool IsOpen,
    bool IsFeatured,
    string[]? Tags,
    string? OpeningHoursJson,
    IEnumerable<MenuCategoryDto> Menu,
    IEnumerable<RestaurantImageDto> Images,
    bool IsFavorite = false);

public record RestaurantImageDto(Guid Id, string ImageUrl, int DisplayOrder);

public record CreateRestaurantRequest(
    string NameAr,
    string? NameEn,
    string? DescriptionAr,
    Guid? CategoryId,
    string Phone,
    string? Email,
    string Address,
    string City,
    decimal? Latitude,
    decimal? Longitude,
    decimal MinOrderAmount,
    decimal DeliveryFee,
    int EstimatedDeliveryMinutes,
    string? TaxId,
    string? BankAccountNumber,
    string? BankName,
    string? OpeningHoursJson,
    string[]? Tags);

public record UpdateRestaurantRequest(
    string NameAr,
    string? NameEn,
    string? DescriptionAr,
    string Phone,
    string? Email,
    string Address,
    decimal MinOrderAmount,
    decimal DeliveryFee,
    int EstimatedDeliveryMinutes,
    string? OpeningHoursJson,
    string[]? Tags);

// ─── Menu DTOs ────────────────────────────────────────────────────────────────
public record MenuCategoryDto(
    Guid Id,
    string NameAr,
    string? NameEn,
    string? ImageUrl,
    int DisplayOrder,
    IEnumerable<ProductDto> Products);

public record ProductDto(
    Guid Id,
    string NameAr,
    string? NameEn,
    string? DescriptionAr,
    string? ImageUrl,
    decimal BasePrice,
    decimal? DiscountedPrice,
    decimal EffectivePrice,
    int? Calories,
    bool IsAvailable,
    bool IsFeatured,
    int PreparationMinutes,
    string[]? Tags,
    decimal AverageRating,
    IEnumerable<ProductOptionDto> Options);

public record ProductOptionDto(
    Guid Id,
    string NameAr,
    bool IsRequired,
    int MinSelections,
    int MaxSelections,
    IEnumerable<ProductOptionValueDto> Values);

public record ProductOptionValueDto(
    Guid Id,
    string NameAr,
    decimal AdditionalPrice,
    bool IsDefault);

public record CreateProductRequest(
    Guid MenuCategoryId,
    string NameAr,
    string? NameEn,
    string? DescriptionAr,
    decimal BasePrice,
    decimal? DiscountedPrice,
    int? Calories,
    int PreparationMinutes,
    string[]? Tags);

public record CreateMenuCategoryRequest(string NameAr, string? NameEn, string? DescriptionAr);

// ─── Order DTOs ───────────────────────────────────────────────────────────────
public record PlaceOrderRequest(
    Guid RestaurantId,
    Guid? DeliveryAddressId,
    string DeliveryAddress,
    decimal? DeliveryLatitude,
    decimal? DeliveryLongitude,
    PaymentMethod PaymentMethod,
    IEnumerable<OrderItemRequest> Items,
    string? CouponCode = null,
    int LoyaltyPointsToUse = 0,
    string? CustomerNotes = null,
    string? DeliveryNotes = null);

public record OrderItemRequest(
    Guid ProductId,
    int Quantity,
    IEnumerable<SelectedOptionRequest>? SelectedOptions = null,
    string? Notes = null);

public record SelectedOptionRequest(Guid OptionId, IEnumerable<Guid> ValueIds);

public record OrderSummaryDto(
    Guid Id,
    string OrderNumber,
    RestaurantSummaryDto Restaurant,
    OrderStatus Status,
    PaymentMethod PaymentMethod,
    PaymentStatus PaymentStatus,
    decimal TotalAmount,
    decimal DeliveryFee,
    decimal DiscountAmount,
    string DeliveryAddress,
    DateTime CreatedAt,
    DateTime? EstimatedDeliveryAt,
    int ItemCount);

public record OrderDetailDto(
    Guid Id,
    string OrderNumber,
    RestaurantSummaryDto Restaurant,
    OrderStatus Status,
    PaymentMethod PaymentMethod,
    PaymentStatus PaymentStatus,
    decimal Subtotal,
    decimal DeliveryFee,
    decimal TaxAmount,
    decimal DiscountAmount,
    decimal TotalAmount,
    string DeliveryAddress,
    string? CustomerNotes,
    string? DeliveryNotes,
    DateTime CreatedAt,
    DateTime? EstimatedDeliveryAt,
    DateTime? DeliveredAt,
    IEnumerable<OrderItemDto> Items,
    IEnumerable<OrderStatusHistoryDto> StatusHistory,
    DriverTrackingDto? Driver);

public record OrderItemDto(
    Guid ProductId,
    string ProductNameAr,
    string? ProductImageUrl,
    int Quantity,
    decimal UnitPrice,
    decimal TotalPrice,
    string? Notes);

public record OrderStatusHistoryDto(OrderStatus Status, string StatusAr, DateTime CreatedAt);

public record DriverTrackingDto(
    Guid DriverId,
    string DriverName,
    string? DriverPhone,
    decimal? CurrentLatitude,
    decimal? CurrentLongitude);

public record ValidateCouponRequest(string Code, Guid RestaurantId, decimal OrderAmount);

public record ValidateCouponResponse(
    bool IsValid,
    string? Error,
    decimal DiscountAmount,
    CouponType? Type,
    decimal? Value);

// ─── Review DTOs ──────────────────────────────────────────────────────────────
public record SubmitReviewRequest(
    decimal FoodRating,
    decimal? DeliveryRating,
    decimal OverallRating,
    string? Comment);

public record ReviewDto(
    Guid Id,
    string CustomerName,
    string? CustomerImageUrl,
    decimal FoodRating,
    decimal? DeliveryRating,
    decimal OverallRating,
    string? Comment,
    string? RestaurantReply,
    DateTime CreatedAt);

// ─── Address DTOs ─────────────────────────────────────────────────────────────
public record AddressDto(
    Guid Id,
    string? Label,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string? Landmark,
    decimal? Latitude,
    decimal? Longitude,
    bool IsDefault);

public record CreateAddressRequest(
    string AddressLine1,
    string? AddressLine2,
    string? Label,
    string City,
    string? Landmark,
    decimal? Latitude,
    decimal? Longitude,
    bool IsDefault = false);

// ─── Driver DTOs ──────────────────────────────────────────────────────────────
public record DriverRegistrationRequest(
    string NationalId,
    string VehicleType,
    string VehiclePlate,
    string? BankAccountNumber,
    string? BankName);

public record DriverProfileDto(
    Guid UserId,
    string FullName,
    string Phone,
    string? ProfileImageUrl,
    string? VehicleType,
    string? VehiclePlate,
    DriverStatus Status,
    bool IsOnline,
    int TotalDeliveries,
    decimal AverageRating);

public record UpdateDriverLocationRequest(decimal Latitude, decimal Longitude);

public record DriverEarningsDto(
    decimal TodayEarnings,
    decimal WeekEarnings,
    decimal MonthEarnings,
    decimal TotalEarnings,
    int TodayDeliveries,
    int WeekDeliveries);

// ─── Analytics DTOs ───────────────────────────────────────────────────────────
public record RestaurantAnalyticsDto(
    decimal TodayRevenue,
    decimal WeekRevenue,
    decimal MonthRevenue,
    int TodayOrders,
    int WeekOrders,
    int MonthOrders,
    decimal AverageOrderValue,
    decimal AverageRating,
    int TotalReviews,
    IEnumerable<DailyRevenueDto> DailyRevenue,
    IEnumerable<TopProductDto> TopProducts);

public record DailyRevenueDto(DateTime Date, decimal Revenue, int Orders);

public record TopProductDto(
    Guid ProductId,
    string ProductName,
    string? ImageUrl,
    int TotalOrders,
    decimal TotalRevenue);

// ─── Admin DTOs ───────────────────────────────────────────────────────────────
public record AdminDashboardDto(
    int TotalRestaurants,
    int ActiveRestaurants,
    int PendingRestaurants,
    int TotalCustomers,
    int TotalDrivers,
    int ActiveDrivers,
    int TodayOrders,
    decimal TodayRevenue,
    decimal TodayCommission,
    int MonthOrders,
    decimal MonthRevenue,
    decimal MonthCommission);

public record ApproveRestaurantRequest(Guid RestaurantId);
public record RejectRestaurantRequest(Guid RestaurantId, string Reason);
public record UpdateCommissionRequest(Guid RestaurantId, decimal CommissionPercentage);

// ─── Coupon DTOs ──────────────────────────────────────────────────────────────
public record CouponDto(
    Guid Id,
    string Code,
    CouponType Type,
    decimal Value,
    decimal MinOrderAmount,
    decimal? MaxDiscountAmount,
    DateTime StartDate,
    DateTime EndDate,
    int? MaxUses,
    int UsedCount,
    bool IsActive);

public record CreateCouponRequest(
    string Code,
    CouponType Type,
    decimal Value,
    decimal MinOrderAmount,
    decimal? MaxDiscountAmount,
    Guid? RestaurantId,
    DateTime StartDate,
    DateTime EndDate,
    int? MaxUses,
    int MaxUsesPerUser = 1);

// ─── Notification DTOs ────────────────────────────────────────────────────────
public record NotificationDto(
    Guid Id,
    string TitleAr,
    string BodyAr,
    string Type,
    bool IsRead,
    DateTime CreatedAt);
