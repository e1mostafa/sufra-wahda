using SufraWahda.Domain.Common;
using SufraWahda.Domain.Enums;

namespace SufraWahda.Domain.Events;

public record OrderStatusChangedEvent(Guid OrderId, OrderStatus NewStatus) : IDomainEvent;

public record OrderPlacedEvent(Guid OrderId, Guid RestaurantId, Guid CustomerId) : IDomainEvent;

public record RestaurantApprovedEvent(Guid RestaurantId) : IDomainEvent;

public record DriverAssignedEvent(Guid OrderId, Guid DriverId) : IDomainEvent;

public record OrderDeliveredEvent(Guid OrderId, Guid CustomerId, decimal TotalAmount) : IDomainEvent;

public record ReviewSubmittedEvent(Guid RestaurantId, decimal NewRating) : IDomainEvent;
