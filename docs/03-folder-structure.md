# سُفرة واحدة — Complete Folder Structure

## Root
```
sufra-wahda/
├── frontend/
│   ├── customer-web/          # Customer-facing Next.js app
│   ├── restaurant-dashboard/  # Restaurant owner Next.js app
│   ├── admin-panel/           # Admin Next.js app
│   └── driver-panel/          # Driver Next.js app (PWA)
├── backend/                   # ASP.NET Core API
├── database/                  # SQL scripts & migrations
├── deployment/                # Docker & infrastructure
├── docs/                      # Documentation
└── .github/                   # CI/CD workflows
```

---

## Frontend — Customer Web (Next.js 14)
```
customer-web/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── verify-otp/
│   │   │   └── page.tsx
│   │   └── forgot-password/
│   │       └── page.tsx
│   ├── (main)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Home page
│   │   ├── restaurants/
│   │   │   ├── page.tsx                # Browse restaurants
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Restaurant detail + menu
│   │   │       └── reviews/
│   │   │           └── page.tsx
│   │   ├── search/
│   │   │   └── page.tsx
│   │   ├── categories/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── cart/
│   │   │   └── page.tsx
│   │   ├── checkout/
│   │   │   └── page.tsx
│   │   ├── payment/
│   │   │   ├── page.tsx
│   │   │   └── success/
│   │   │       └── page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx                # Order history
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Order details
│   │   │       └── tracking/
│   │   │           └── page.tsx        # Live tracking
│   │   ├── profile/
│   │   │   ├── page.tsx
│   │   │   ├── addresses/
│   │   │   │   └── page.tsx
│   │   │   ├── favorites/
│   │   │   │   └── page.tsx
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx
│   │   │   └── loyalty/
│   │   │       └── page.tsx
│   │   └── products/
│   │       └── [id]/
│   │           └── page.tsx
│   ├── api/                            # Next.js API routes (BFF)
│   │   └── revalidate/
│   │       └── route.ts
│   ├── layout.tsx                      # Root layout (RTL)
│   └── globals.css
├── components/
│   ├── ui/                             # Shadcn UI components
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── BottomNav.tsx               # Mobile bottom nav
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── home/
│   │   ├── HeroBanner.tsx
│   │   ├── CategoryScroll.tsx
│   │   ├── FeaturedRestaurants.tsx
│   │   ├── SponsoredRestaurants.tsx
│   │   └── PromoSection.tsx
│   ├── restaurants/
│   │   ├── RestaurantCard.tsx
│   │   ├── RestaurantGrid.tsx
│   │   ├── RestaurantHeader.tsx
│   │   ├── MenuSection.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductModal.tsx
│   │   ├── ReviewCard.tsx
│   │   └── RestaurantInfo.tsx
│   ├── cart/
│   │   ├── CartDrawer.tsx
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── CartButton.tsx
│   ├── checkout/
│   │   ├── AddressSelector.tsx
│   │   ├── PaymentMethodSelector.tsx
│   │   ├── CouponInput.tsx
│   │   └── OrderSummary.tsx
│   ├── orders/
│   │   ├── OrderCard.tsx
│   │   ├── OrderStatusBadge.tsx
│   │   ├── OrderTimeline.tsx
│   │   └── LiveTrackingMap.tsx
│   ├── common/
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── RatingStars.tsx
│   │   ├── ImageUpload.tsx
│   │   ├── SearchBar.tsx
│   │   ├── InfiniteScroll.tsx
│   │   └── Skeleton loaders/
│   └── auth/
│       ├── PhoneInput.tsx
│       ├── OtpInput.tsx
│       └── ProtectedRoute.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useLocation.ts
│   ├── useOrders.ts
│   ├── useNotifications.ts
│   ├── useSocket.ts
│   └── useGeolocation.ts
├── store/
│   ├── authStore.ts           # Zustand auth store
│   ├── cartStore.ts           # Cart state
│   ├── uiStore.ts             # UI state (modals, drawers)
│   └── locationStore.ts       # User location
├── lib/
│   ├── api.ts                 # Axios instance + interceptors
│   ├── auth.ts                # Auth helpers
│   ├── socket.ts              # Socket.io client
│   ├── maps.ts                # Google Maps helpers
│   └── utils.ts               # Utilities
├── services/
│   ├── authService.ts
│   ├── restaurantService.ts
│   ├── orderService.ts
│   ├── paymentService.ts
│   ├── addressService.ts
│   └── notificationService.ts
├── types/
│   ├── auth.types.ts
│   ├── restaurant.types.ts
│   ├── order.types.ts
│   ├── product.types.ts
│   └── common.types.ts
├── constants/
│   ├── routes.ts
│   ├── colors.ts
│   └── config.ts
├── public/
│   ├── fonts/
│   ├── icons/
│   └── images/
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## Backend — ASP.NET Core (Clean Architecture)
```
backend/
├── src/
│   ├── SufraWahda.API/                        # Presentation Layer
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs
│   │   │   ├── RestaurantsController.cs
│   │   │   ├── MenuController.cs
│   │   │   ├── CartController.cs
│   │   │   ├── OrdersController.cs
│   │   │   ├── PaymentsController.cs
│   │   │   ├── AddressesController.cs
│   │   │   ├── FavoritesController.cs
│   │   │   ├── NotificationsController.cs
│   │   │   ├── DriverController.cs
│   │   │   ├── LocationController.cs
│   │   │   └── Admin/
│   │   │       ├── AdminDashboardController.cs
│   │   │       ├── AdminRestaurantsController.cs
│   │   │       ├── AdminUsersController.cs
│   │   │       ├── AdminOrdersController.cs
│   │   │       ├── AdminCouponsController.cs
│   │   │       ├── AdminAdsController.cs
│   │   │       └── AdminSettingsController.cs
│   │   ├── Hubs/
│   │   │   ├── OrderHub.cs
│   │   │   ├── NotificationHub.cs
│   │   │   └── RestaurantHub.cs
│   │   ├── Middleware/
│   │   │   ├── ExceptionHandlingMiddleware.cs
│   │   │   ├── RequestLoggingMiddleware.cs
│   │   │   └── RateLimitingMiddleware.cs
│   │   ├── Filters/
│   │   │   └── ValidationFilter.cs
│   │   ├── Extensions/
│   │   │   ├── ServiceCollectionExtensions.cs
│   │   │   └── ApplicationExtensions.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   │
│   ├── SufraWahda.Application/                # Application Layer
│   │   ├── Features/
│   │   │   ├── Auth/
│   │   │   │   ├── Commands/
│   │   │   │   │   ├── RegisterCustomer/
│   │   │   │   │   ├── LoginCommand/
│   │   │   │   │   ├── SendOtpCommand/
│   │   │   │   │   ├── VerifyOtpCommand/
│   │   │   │   │   └── RefreshTokenCommand/
│   │   │   │   └── Queries/
│   │   │   │       └── GetCurrentUser/
│   │   │   ├── Restaurants/
│   │   │   │   ├── Commands/
│   │   │   │   │   ├── CreateRestaurant/
│   │   │   │   │   ├── UpdateRestaurant/
│   │   │   │   │   └── ToggleOpenStatus/
│   │   │   │   └── Queries/
│   │   │   │       ├── GetRestaurants/
│   │   │   │       ├── GetRestaurantById/
│   │   │   │       ├── GetNearbyRestaurants/
│   │   │   │       ├── SearchRestaurants/
│   │   │   │       └── GetRestaurantMenu/
│   │   │   ├── Orders/
│   │   │   │   ├── Commands/
│   │   │   │   │   ├── PlaceOrder/
│   │   │   │   │   ├── ConfirmOrder/
│   │   │   │   │   ├── RejectOrder/
│   │   │   │   │   ├── CancelOrder/
│   │   │   │   │   └── MarkOrderReady/
│   │   │   │   └── Queries/
│   │   │   │       ├── GetOrders/
│   │   │   │       ├── GetOrderById/
│   │   │   │       └── GetOrderTracking/
│   │   │   ├── Payments/
│   │   │   │   └── Commands/
│   │   │   │       ├── InitiatePayment/
│   │   │   │       └── HandlePaymentWebhook/
│   │   │   └── ...other features
│   │   ├── Common/
│   │   │   ├── Interfaces/
│   │   │   │   ├── ICurrentUserService.cs
│   │   │   │   ├── INotificationService.cs
│   │   │   │   ├── IPaymentService.cs
│   │   │   │   └── IStorageService.cs
│   │   │   ├── Models/
│   │   │   │   ├── Result.cs
│   │   │   │   ├── PagedResult.cs
│   │   │   │   └── ApiResponse.cs
│   │   │   └── Behaviours/
│   │   │       ├── ValidationBehaviour.cs
│   │   │       ├── LoggingBehaviour.cs
│   │   │       └── CachingBehaviour.cs
│   │   ├── Mappings/
│   │   │   └── AutoMapperProfile.cs
│   │   └── DTOs/
│   │       ├── AuthDtos.cs
│   │       ├── RestaurantDtos.cs
│   │       ├── OrderDtos.cs
│   │       └── ...
│   │
│   ├── SufraWahda.Domain/                     # Domain Layer
│   │   ├── Entities/
│   │   │   ├── User.cs
│   │   │   ├── Restaurant.cs
│   │   │   ├── Product.cs
│   │   │   ├── Order.cs
│   │   │   ├── OrderItem.cs
│   │   │   ├── Delivery.cs
│   │   │   ├── Coupon.cs
│   │   │   ├── Review.cs
│   │   │   └── ...
│   │   ├── Enums/
│   │   │   ├── OrderStatus.cs
│   │   │   ├── UserRole.cs
│   │   │   └── ...
│   │   ├── Events/
│   │   │   ├── OrderPlacedEvent.cs
│   │   │   ├── OrderConfirmedEvent.cs
│   │   │   └── ...
│   │   ├── ValueObjects/
│   │   │   ├── Money.cs
│   │   │   ├── Address.cs
│   │   │   └── Coordinates.cs
│   │   └── Interfaces/
│   │       ├── IRepository.cs
│   │       ├── IOrderRepository.cs
│   │       └── IRestaurantRepository.cs
│   │
│   └── SufraWahda.Infrastructure/             # Infrastructure Layer
│       ├── Persistence/
│       │   ├── ApplicationDbContext.cs
│       │   ├── Configurations/                # EF Fluent API configs
│       │   │   ├── UserConfiguration.cs
│       │   │   ├── RestaurantConfiguration.cs
│       │   │   └── ...
│       │   ├── Repositories/
│       │   │   ├── BaseRepository.cs
│       │   │   ├── UserRepository.cs
│       │   │   ├── RestaurantRepository.cs
│       │   │   └── OrderRepository.cs
│       │   └── Migrations/
│       ├── Services/
│       │   ├── JwtService.cs
│       │   ├── SmsService.cs               # Vonage integration
│       │   ├── EmailService.cs             # SendGrid integration
│       │   ├── CloudinaryService.cs
│       │   ├── FirebaseService.cs          # Push notifications
│       │   ├── FawryPaymentService.cs
│       │   ├── StripePaymentService.cs
│       │   ├── RedisService.cs
│       │   └── GoogleMapsService.cs
│       ├── BackgroundJobs/
│       │   ├── OrderTimeoutJob.cs
│       │   ├── DailyReportJob.cs
│       │   └── PayoutCalculationJob.cs
│       └── DependencyInjection.cs
│
└── tests/
    ├── SufraWahda.UnitTests/
    └── SufraWahda.IntegrationTests/
```

---

## Restaurant Dashboard (Next.js)
```
restaurant-dashboard/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Dashboard overview
│   │   ├── orders/
│   │   │   ├── page.tsx                # Live orders
│   │   │   └── history/page.tsx
│   │   ├── menu/
│   │   │   ├── page.tsx                # Menu management
│   │   │   ├── categories/page.tsx
│   │   │   └── products/
│   │   │       ├── new/page.tsx
│   │   │       └── [id]/edit/page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── reviews/page.tsx
│   │   └── settings/page.tsx
```

---

## Admin Panel (Next.js)
```
admin-panel/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Admin dashboard
│   │   ├── restaurants/
│   │   │   ├── page.tsx
│   │   │   ├── pending/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── customers/page.tsx
│   │   ├── drivers/
│   │   │   ├── page.tsx
│   │   │   └── pending/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── coupons/
│   │   │   ├── page.tsx
│   │   │   └── new/page.tsx
│   │   ├── ads/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── payouts/page.tsx
│   │   └── settings/page.tsx
```

---

## Deployment
```
deployment/
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.customer
│   ├── Dockerfile.restaurant
│   ├── Dockerfile.admin
│   └── Dockerfile.driver
├── docker-compose.yml
├── docker-compose.prod.yml
├── nginx/
│   ├── nginx.conf
│   └── sites/
│       ├── api.conf
│       └── frontend.conf
└── scripts/
    ├── deploy.sh
    └── db-migrate.sh
```
