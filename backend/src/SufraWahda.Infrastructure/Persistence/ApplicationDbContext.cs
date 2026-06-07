using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using SufraWahda.Domain.Common;
using SufraWahda.Domain.Entities;
using SufraWahda.Domain.Enums;

namespace SufraWahda.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    // ─── DbSets ────────────────────────────────────────────────────────────────
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PhoneVerification> PhoneVerifications => Set<PhoneVerification>();
    public DbSet<Address> Addresses => Set<Address>();
    public DbSet<RestaurantCategory> RestaurantCategories => Set<RestaurantCategory>();
    public DbSet<Restaurant> Restaurants => Set<Restaurant>();
    public DbSet<RestaurantImage> RestaurantImages => Set<RestaurantImage>();
    public DbSet<MenuCategory> MenuCategories => Set<MenuCategory>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductOption> ProductOptions => Set<ProductOption>();
    public DbSet<ProductOptionValue> ProductOptionValues => Set<ProductOptionValue>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();
    public DbSet<DriverProfile> DriverProfiles => Set<DriverProfile>();
    public DbSet<Delivery> Deliveries => Set<Delivery>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<RestaurantReview> RestaurantReviews => Set<RestaurantReview>();
    public DbSet<FavoriteRestaurant> FavoriteRestaurants => Set<FavoriteRestaurant>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Advertisement> Advertisements => Set<Advertisement>();
    public DbSet<DeliveryZone> DeliveryZones => Set<DeliveryZone>();
    public DbSet<PlatformSetting> PlatformSettings => Set<PlatformSetting>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);
        mb.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // ─── Global Query Filters (Soft Delete) ───────────────────────────────
        mb.Entity<User>().HasQueryFilter(e => e.DeletedAt == null);
        mb.Entity<Restaurant>().HasQueryFilter(e => e.DeletedAt == null);
        mb.Entity<Product>().HasQueryFilter(e => e.DeletedAt == null);

        // ─── User ──────────────────────────────────────────────────────────────
        mb.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(x => x.Id);
            e.Property(x => x.FullName).HasMaxLength(100).IsRequired();
            e.Property(x => x.Phone).HasMaxLength(20).IsRequired();
            e.HasIndex(x => x.Phone).IsUnique();
            e.Property(x => x.Email).HasMaxLength(150);
            e.HasIndex(x => x.Email).IsUnique().HasFilter("email IS NOT NULL");
            e.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
            e.Property(x => x.Role).HasConversion<string>();
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.ReferralCode).HasMaxLength(20);
            e.HasIndex(x => x.ReferralCode).IsUnique().HasFilter("referral_code IS NOT NULL");
            e.Property(x => x.Language).HasMaxLength(5).HasDefaultValue("ar");
            e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("NOW()");
            e.HasMany(x => x.RefreshTokens).WithOne(x => x.User)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Addresses).WithOne(x => x.User)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Notifications).WithOne(x => x.User)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.DriverProfile).WithOne(x => x.User)
                .HasForeignKey<DriverProfile>(x => x.UserId);
        });

        // ─── RefreshToken ──────────────────────────────────────────────────────
        mb.Entity<RefreshToken>(e =>
        {
            e.ToTable("refresh_tokens");
            e.HasKey(x => x.Id);
            e.Property(x => x.Token).HasMaxLength(500).IsRequired();
            e.HasIndex(x => x.Token).IsUnique();
        });

        // ─── PhoneVerification ─────────────────────────────────────────────────
        mb.Entity<PhoneVerification>(e =>
        {
            e.ToTable("phone_verifications");
            e.HasKey(x => x.Id);
            e.Property(x => x.Phone).HasMaxLength(20).IsRequired();
            e.Property(x => x.Code).HasMaxLength(6).IsRequired();
        });

        // ─── Address ──────────────────────────────────────────────────────────
        mb.Entity<Address>(e =>
        {
            e.ToTable("addresses");
            e.HasKey(x => x.Id);
            e.Property(x => x.AddressLine1).HasMaxLength(200).IsRequired();
            e.Property(x => x.City).HasMaxLength(100).HasDefaultValue("المنيا");
            e.Property(x => x.Governorate).HasMaxLength(100).HasDefaultValue("المنيا");
            e.Property(x => x.Latitude).HasColumnType("decimal(10,8)");
            e.Property(x => x.Longitude).HasColumnType("decimal(11,8)");
        });

        // ─── RestaurantCategory ────────────────────────────────────────────────
        mb.Entity<RestaurantCategory>(e =>
        {
            e.ToTable("restaurant_categories");
            e.HasKey(x => x.Id);
            e.Property(x => x.NameAr).HasMaxLength(100).IsRequired();
            e.Property(x => x.NameEn).HasMaxLength(100);
        });

        // ─── Restaurant ────────────────────────────────────────────────────────
        mb.Entity<Restaurant>(e =>
        {
            e.ToTable("restaurants");
            e.HasKey(x => x.Id);
            e.Property(x => x.NameAr).HasMaxLength(200).IsRequired();
            e.Property(x => x.Phone).HasMaxLength(20).IsRequired();
            e.Property(x => x.Status).HasConversion<string>().HasDefaultValue(RestaurantStatus.PendingApproval);
            e.Property(x => x.CommissionPercentage).HasColumnType("decimal(5,2)").HasDefaultValue(15m);
            e.Property(x => x.DeliveryFee).HasColumnType("decimal(10,2)");
            e.Property(x => x.MinOrderAmount).HasColumnType("decimal(10,2)");
            e.Property(x => x.AverageRating).HasColumnType("decimal(3,2)");
            e.Property(x => x.Latitude).HasColumnType("decimal(10,8)");
            e.Property(x => x.Longitude).HasColumnType("decimal(11,8)");
            e.Property(x => x.Tags).HasColumnType("text[]");
            e.Property(x => x.OpeningHoursJson).HasColumnName("opening_hours").HasColumnType("jsonb");
            e.HasOne(x => x.Owner).WithMany()
                .HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Category).WithMany(c => c.Restaurants)
                .HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(x => x.MenuCategories).WithOne(x => x.Restaurant)
                .HasForeignKey(x => x.RestaurantId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Images).WithOne(x => x.Restaurant)
                .HasForeignKey(x => x.RestaurantId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Reviews).WithOne(x => x.Restaurant)
                .HasForeignKey(x => x.RestaurantId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.City);
            e.HasIndex(x => new { x.Latitude, x.Longitude });
            e.HasIndex(x => x.IsFeatured).HasFilter("is_featured = TRUE");
        });

        // ─── RestaurantImage ───────────────────────────────────────────────────
        mb.Entity<RestaurantImage>(e =>
        {
            e.ToTable("restaurant_images");
            e.HasKey(x => x.Id);
        });

        // ─── MenuCategory ──────────────────────────────────────────────────────
        mb.Entity<MenuCategory>(e =>
        {
            e.ToTable("menu_categories");
            e.HasKey(x => x.Id);
            e.Property(x => x.NameAr).HasMaxLength(100).IsRequired();
            e.HasMany(x => x.Products).WithOne(x => x.MenuCategory)
                .HasForeignKey(x => x.MenuCategoryId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Product ───────────────────────────────────────────────────────────
        mb.Entity<Product>(e =>
        {
            e.ToTable("products");
            e.HasKey(x => x.Id);
            e.Property(x => x.NameAr).HasMaxLength(200).IsRequired();
            e.Property(x => x.BasePrice).HasColumnType("decimal(10,2)").IsRequired();
            e.Property(x => x.DiscountedPrice).HasColumnType("decimal(10,2)");
            e.Property(x => x.AverageRating).HasColumnType("decimal(3,2)");
            e.Property(x => x.Tags).HasColumnType("text[]");
            e.HasOne(x => x.Restaurant).WithMany()
                .HasForeignKey(x => x.RestaurantId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Options).WithOne(x => x.Product)
                .HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.RestaurantId);
            e.HasIndex(x => x.MenuCategoryId);
        });

        // ─── ProductOption ─────────────────────────────────────────────────────
        mb.Entity<ProductOption>(e =>
        {
            e.ToTable("product_options");
            e.HasKey(x => x.Id);
            e.Property(x => x.NameAr).HasMaxLength(100).IsRequired();
            e.HasMany(x => x.Values).WithOne(x => x.Option)
                .HasForeignKey(x => x.OptionId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── ProductOptionValue ────────────────────────────────────────────────
        mb.Entity<ProductOptionValue>(e =>
        {
            e.ToTable("product_option_values");
            e.HasKey(x => x.Id);
            e.Property(x => x.NameAr).HasMaxLength(100).IsRequired();
            e.Property(x => x.AdditionalPrice).HasColumnType("decimal(10,2)");
        });

        // ─── Order ─────────────────────────────────────────────────────────────
        mb.Entity<Order>(e =>
        {
            e.ToTable("orders");
            e.HasKey(x => x.Id);
            e.Property(x => x.OrderNumber).HasMaxLength(20).IsRequired();
            e.HasIndex(x => x.OrderNumber).IsUnique();
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.PaymentMethod).HasConversion<string>();
            e.Property(x => x.PaymentStatus).HasConversion<string>();
            e.Property(x => x.Subtotal).HasColumnType("decimal(10,2)");
            e.Property(x => x.DeliveryFee).HasColumnType("decimal(10,2)");
            e.Property(x => x.TaxAmount).HasColumnType("decimal(10,2)");
            e.Property(x => x.DiscountAmount).HasColumnType("decimal(10,2)");
            e.Property(x => x.TotalAmount).HasColumnType("decimal(10,2)");
            e.Property(x => x.DeliveryLatitude).HasColumnType("decimal(10,8)");
            e.Property(x => x.DeliveryLongitude).HasColumnType("decimal(11,8)");
            e.HasOne(x => x.Customer).WithMany(x => x.Orders)
                .HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Restaurant).WithMany(x => x.Orders)
                .HasForeignKey(x => x.RestaurantId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Driver).WithMany()
                .HasForeignKey(x => x.DriverId).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(x => x.Items).WithOne(x => x.Order)
                .HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.StatusHistory).WithOne(x => x.Order)
                .HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Delivery).WithOne(x => x.Order)
                .HasForeignKey<Delivery>(x => x.OrderId);
            e.HasIndex(x => x.CustomerId);
            e.HasIndex(x => x.RestaurantId);
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.CreatedAt);
        });

        // ─── OrderItem ─────────────────────────────────────────────────────────
        mb.Entity<OrderItem>(e =>
        {
            e.ToTable("order_items");
            e.HasKey(x => x.Id);
            e.Property(x => x.UnitPrice).HasColumnType("decimal(10,2)");
            e.Property(x => x.TotalPrice).HasColumnType("decimal(10,2)");
            e.HasOne(x => x.Product).WithMany()
                .HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        // ─── OrderStatusHistory ────────────────────────────────────────────────
        mb.Entity<OrderStatusHistory>(e =>
        {
            e.ToTable("order_status_history");
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>();
        });

        // ─── DriverProfile ─────────────────────────────────────────────────────
        mb.Entity<DriverProfile>(e =>
        {
            e.ToTable("driver_profiles");
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.CurrentLatitude).HasColumnType("decimal(10,8)");
            e.Property(x => x.CurrentLongitude).HasColumnType("decimal(11,8)");
            e.Property(x => x.AverageRating).HasColumnType("decimal(3,2)");
        });

        // ─── Delivery ──────────────────────────────────────────────────────────
        mb.Entity<Delivery>(e =>
        {
            e.ToTable("deliveries");
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.DistanceKm).HasColumnType("decimal(8,2)");
            e.Property(x => x.DriverEarnings).HasColumnType("decimal(10,2)");
            e.Property(x => x.PickupLatitude).HasColumnType("decimal(10,8)");
            e.Property(x => x.PickupLongitude).HasColumnType("decimal(11,8)");
            e.Property(x => x.DeliveryLatitude).HasColumnType("decimal(10,8)");
            e.Property(x => x.DeliveryLongitude).HasColumnType("decimal(11,8)");
            e.HasOne(x => x.Driver).WithMany()
                .HasForeignKey(x => x.DriverId).OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Coupon ────────────────────────────────────────────────────────────
        mb.Entity<Coupon>(e =>
        {
            e.ToTable("coupons");
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).HasMaxLength(50).IsRequired();
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.Type).HasConversion<string>();
            e.Property(x => x.Value).HasColumnType("decimal(10,2)");
            e.Property(x => x.MinOrderAmount).HasColumnType("decimal(10,2)");
            e.Property(x => x.MaxDiscountAmount).HasColumnType("decimal(10,2)");
        });

        // ─── RestaurantReview ──────────────────────────────────────────────────
        mb.Entity<RestaurantReview>(e =>
        {
            e.ToTable("restaurant_reviews");
            e.HasKey(x => x.Id);
            e.Property(x => x.FoodRating).HasColumnType("decimal(2,1)");
            e.Property(x => x.DeliveryRating).HasColumnType("decimal(2,1)");
            e.Property(x => x.OverallRating).HasColumnType("decimal(2,1)");
            e.Property(x => x.Images).HasColumnType("text[]");
            e.HasIndex(x => x.OrderId).IsUnique();
            e.HasOne(x => x.Customer).WithMany()
                .HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Restrict);
        });

        // ─── FavoriteRestaurant ────────────────────────────────────────────────
        mb.Entity<FavoriteRestaurant>(e =>
        {
            e.ToTable("favorite_restaurants");
            e.HasKey(x => new { x.UserId, x.RestaurantId });
            e.HasOne(x => x.User).WithMany(x => x.FavoriteRestaurants)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Restaurant).WithMany()
                .HasForeignKey(x => x.RestaurantId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Notification ──────────────────────────────────────────────────────
        mb.Entity<Notification>(e =>
        {
            e.ToTable("notifications");
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).HasConversion<string>();
            e.Property(x => x.TitleAr).HasMaxLength(200).IsRequired();
            e.Property(x => x.DataJson).HasColumnType("jsonb");
            e.HasIndex(x => new { x.UserId, x.IsRead, x.CreatedAt });
        });

        // ─── Advertisement ─────────────────────────────────────────────────────
        mb.Entity<Advertisement>(e =>
        {
            e.ToTable("advertisements");
            e.HasKey(x => x.Id);
            e.Property(x => x.Position).HasConversion<string>();
        });

        // ─── DeliveryZone ──────────────────────────────────────────────────────
        mb.Entity<DeliveryZone>(e =>
        {
            e.ToTable("delivery_zones");
            e.HasKey(x => x.Id);
            e.Property(x => x.PolygonCoordinatesJson)
                .HasColumnName("polygon_coordinates").HasColumnType("jsonb");
            e.Property(x => x.BaseDeliveryFee).HasColumnType("decimal(10,2)");
            e.Property(x => x.FeePerKm).HasColumnType("decimal(10,2)");
        });

        // ─── PlatformSetting ───────────────────────────────────────────────────
        mb.Entity<PlatformSetting>(e =>
        {
            e.ToTable("platform_settings");
            e.HasKey(x => x.Key);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>()
            .Where(e => e.State is EntityState.Modified))
        {
            entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
        return base.SaveChangesAsync(ct);
    }
}
