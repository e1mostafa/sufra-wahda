namespace SufraWahda.Domain.Enums;

public enum UserRole
{
    Customer = 1,
    RestaurantOwner = 2,
    Driver = 3,
    Admin = 4,
    SuperAdmin = 5
}

public enum UserStatus
{
    PendingVerification = 1,
    Active = 2,
    Inactive = 3,
    Suspended = 4
}

public enum OrderStatus
{
    Pending = 1,
    Confirmed = 2,
    Preparing = 3,
    ReadyForPickup = 4,
    PickedUp = 5,
    OnTheWay = 6,
    Delivered = 7,
    Cancelled = 8,
    Refunded = 9
}

public enum PaymentMethod
{
    Cash = 1,
    Visa = 2,
    Mastercard = 3,
    Fawry = 4,
    VodafoneCash = 5,
    EtisalatCash = 6,
    OrangeMoney = 7
}

public enum PaymentStatus
{
    Pending = 1,
    Paid = 2,
    Failed = 3,
    Refunded = 4
}

public enum RestaurantStatus
{
    PendingApproval = 1,
    Active = 2,
    Inactive = 3,
    Suspended = 4
}

public enum DriverStatus
{
    PendingVerification = 1,
    Active = 2,
    Inactive = 3,
    Suspended = 4,
    OnDelivery = 5,
    Offline = 6
}

public enum DeliveryStatus
{
    Searching = 1,
    Assigned = 2,
    PickedUp = 3,
    Delivered = 4,
    Failed = 5
}

public enum CouponType
{
    Percentage = 1,
    FixedAmount = 2,
    FreeDelivery = 3
}

public enum NotificationType
{
    OrderUpdate = 1,
    Promotion = 2,
    SystemAlert = 3,
    PaymentConfirm = 4,
    NewOrder = 5
}

public enum AdPosition
{
    HomeBanner = 1,
    CategoryTop = 2,
    SearchResults = 3,
    Sidebar = 4
}
