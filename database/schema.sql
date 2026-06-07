-- =====================================================
-- سُفرة واحدة — Complete PostgreSQL Database Schema
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('Customer', 'RestaurantOwner', 'Driver', 'Admin', 'SuperAdmin');
CREATE TYPE user_status AS ENUM ('Active', 'Inactive', 'Suspended', 'PendingVerification');
CREATE TYPE order_status AS ENUM (
  'Pending', 'Confirmed', 'Preparing', 'ReadyForPickup',
  'PickedUp', 'OnTheWay', 'Delivered', 'Cancelled', 'Refunded'
);
CREATE TYPE payment_method AS ENUM ('Cash', 'Visa', 'Mastercard', 'Fawry', 'VodafoneCash', 'EtisalatCash', 'OrangeMoney');
CREATE TYPE payment_status AS ENUM ('Pending', 'Paid', 'Failed', 'Refunded');
CREATE TYPE restaurant_status AS ENUM ('PendingApproval', 'Active', 'Inactive', 'Suspended');
CREATE TYPE driver_status AS ENUM ('PendingVerification', 'Active', 'Inactive', 'Suspended', 'OnDelivery', 'Offline');
CREATE TYPE delivery_status AS ENUM ('Searching', 'Assigned', 'PickedUp', 'Delivered', 'Failed');
CREATE TYPE coupon_type AS ENUM ('Percentage', 'FixedAmount', 'FreeDelivery');
CREATE TYPE notification_type AS ENUM ('OrderUpdate', 'Promotion', 'SystemAlert', 'PaymentConfirm', 'NewOrder');
CREATE TYPE ad_position AS ENUM ('HomeBanner', 'CategoryTop', 'SearchResults', 'Sidebar');

-- =====================================================
-- CORE USERS
-- =====================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(150) UNIQUE,
  password_hash VARCHAR(500) NOT NULL,
  role user_role NOT NULL DEFAULT 'Customer',
  status user_status NOT NULL DEFAULT 'PendingVerification',
  profile_image_url TEXT,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  date_of_birth DATE,
  gender VARCHAR(10),
  language VARCHAR(5) DEFAULT 'ar',
  loyalty_points INTEGER DEFAULT 0,
  referral_code VARCHAR(20) UNIQUE,
  referred_by UUID REFERENCES users(id),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE phone_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADDRESSES
-- =====================================================

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(50),            -- Home, Work, Other
  address_line1 VARCHAR(200) NOT NULL,
  address_line2 VARCHAR(200),
  city VARCHAR(100) NOT NULL DEFAULT 'المنيا',
  governorate VARCHAR(100) NOT NULL DEFAULT 'المنيا',
  landmark VARCHAR(200),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RESTAURANTS
-- =====================================================

CREATE TABLE restaurant_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  icon_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id),
  name_ar VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  description_ar TEXT,
  description_en TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  category_id UUID REFERENCES restaurant_categories(id),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'المنيا',
  governorate VARCHAR(100) NOT NULL DEFAULT 'المنيا',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status restaurant_status DEFAULT 'PendingApproval',
  is_open BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_sponsored BOOLEAN DEFAULT FALSE,
  sponsor_expires_at TIMESTAMPTZ,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  estimated_delivery_minutes INTEGER DEFAULT 45,
  max_delivery_radius_km DECIMAL(5, 2) DEFAULT 10,
  commission_percentage DECIMAL(5, 2) DEFAULT 15.00,
  tax_id VARCHAR(50),
  bank_account_number VARCHAR(50),
  bank_name VARCHAR(100),
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  opening_hours JSONB,  -- {"Mon": {"open": "09:00", "close": "22:00"}, ...}
  tags TEXT[],
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE restaurant_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MENU
-- =====================================================

CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description_ar TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  menu_category_id UUID NOT NULL REFERENCES menu_categories(id),
  name_ar VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  description_ar TEXT,
  description_en TEXT,
  image_url TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  discounted_price DECIMAL(10, 2),
  calories INTEGER,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  preparation_minutes INTEGER DEFAULT 15,
  tags TEXT[],               -- ['spicy', 'vegetarian', 'halal']
  display_order INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE product_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  is_required BOOLEAN DEFAULT FALSE,
  min_selections INTEGER DEFAULT 0,
  max_selections INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE product_option_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  option_id UUID NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  additional_price DECIMAL(10, 2) DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- ORDERS
-- =====================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES users(id),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  driver_id UUID REFERENCES users(id),
  status order_status NOT NULL DEFAULT 'Pending',
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'Pending',
  payment_reference VARCHAR(200),
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  coupon_id UUID,
  loyalty_points_used INTEGER DEFAULT 0,
  loyalty_points_earned INTEGER DEFAULT 0,
  delivery_address TEXT NOT NULL,
  delivery_latitude DECIMAL(10, 8),
  delivery_longitude DECIMAL(11, 8),
  delivery_notes TEXT,
  customer_notes TEXT,
  restaurant_notes TEXT,
  rejection_reason TEXT,
  estimated_delivery_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  prepared_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name_ar VARCHAR(200) NOT NULL,
  product_image_url TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  selected_options JSONB,    -- snapshot of selected options
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  changed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DELIVERY
-- =====================================================

CREATE TABLE driver_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  national_id VARCHAR(20),
  national_id_image_url TEXT,
  vehicle_type VARCHAR(50),   -- Motorcycle, Car, Bicycle
  vehicle_plate VARCHAR(20),
  license_image_url TEXT,
  status driver_status DEFAULT 'PendingVerification',
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  last_location_update TIMESTAMPTZ,
  is_online BOOLEAN DEFAULT FALSE,
  bank_account_number VARCHAR(50),
  bank_name VARCHAR(100),
  rejection_reason TEXT,
  total_deliveries INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id),
  driver_id UUID NOT NULL REFERENCES users(id),
  status delivery_status DEFAULT 'Assigned',
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  delivery_latitude DECIMAL(10, 8),
  delivery_longitude DECIMAL(11, 8),
  distance_km DECIMAL(8, 2),
  driver_earnings DECIMAL(10, 2),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE TABLE driver_location_logs (
  id BIGSERIAL PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PAYMENTS & FINANCIAL
-- =====================================================

CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  payment_method payment_method NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EGP',
  status payment_status DEFAULT 'Pending',
  gateway_transaction_id VARCHAR(200),
  gateway_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE restaurant_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_revenue DECIMAL(12, 2) NOT NULL,
  commission_amount DECIMAL(12, 2) NOT NULL,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  net_payout DECIMAL(12, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'Pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE driver_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES users(id),
  delivery_id UUID NOT NULL REFERENCES deliveries(id),
  amount DECIMAL(10, 2) NOT NULL,
  bonus DECIMAL(10, 2) DEFAULT 0,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COUPONS & PROMOTIONS
-- =====================================================

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  type coupon_type NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount_amount DECIMAL(10, 2),
  restaurant_id UUID REFERENCES restaurants(id),  -- NULL = platform-wide
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  max_uses INTEGER,
  max_uses_per_user INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coupon_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES coupons(id),
  user_id UUID NOT NULL REFERENCES users(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  discount_amount DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  type VARCHAR(20) NOT NULL,   -- 'Earned', 'Redeemed', 'Expired', 'Bonus'
  points INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RATINGS & REVIEWS
-- =====================================================

CREATE TABLE restaurant_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id),
  food_rating DECIMAL(2, 1) NOT NULL,
  delivery_rating DECIMAL(2, 1),
  overall_rating DECIMAL(2, 1) NOT NULL,
  comment TEXT,
  images TEXT[],
  is_visible BOOLEAN DEFAULT TRUE,
  restaurant_reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE driver_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id),
  driver_id UUID NOT NULL REFERENCES users(id),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id),
  rating DECIMAL(2, 1) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FAVORITES
-- =====================================================

CREATE TABLE favorite_restaurants (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, restaurant_id)
);

CREATE TABLE favorite_products (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title_ar VARCHAR(200) NOT NULL,
  body_ar TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform VARCHAR(10),   -- 'web', 'android', 'ios'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- =====================================================
-- ADVERTISEMENTS
-- =====================================================

CREATE TABLE advertisements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_ar VARCHAR(200) NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  restaurant_id UUID REFERENCES restaurants(id),
  position ad_position NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ZONES & DELIVERY AREAS
-- =====================================================

CREATE TABLE delivery_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'المنيا',
  polygon_coordinates JSONB NOT NULL,  -- Array of {lat, lng}
  base_delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
  fee_per_km DECIMAL(10, 2) DEFAULT 1.50,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SYSTEM / ADMIN
-- =====================================================

CREATE TABLE platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Users
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Restaurants
CREATE INDEX idx_restaurants_status ON restaurants(status);
CREATE INDEX idx_restaurants_city ON restaurants(city);
CREATE INDEX idx_restaurants_category ON restaurants(category_id);
CREATE INDEX idx_restaurants_location ON restaurants(latitude, longitude);
CREATE INDEX idx_restaurants_featured ON restaurants(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_restaurants_name_trgm ON restaurants USING GIN (name_ar gin_trgm_ops);

-- Products
CREATE INDEX idx_products_restaurant ON products(restaurant_id);
CREATE INDEX idx_products_category ON products(menu_category_id);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_products_name_trgm ON products USING GIN (name_ar gin_trgm_ops);

-- Orders
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_driver ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_number ON orders(order_number);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- Driver locations
CREATE INDEX idx_driver_location ON driver_profiles(current_latitude, current_longitude) WHERE is_online = TRUE;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Platform settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('platform_name', 'سُفرة واحدة', 'Platform name'),
  ('default_commission', '15', 'Default commission percentage'),
  ('min_driver_earnings_per_delivery', '10', 'Minimum driver earnings per delivery in EGP'),
  ('loyalty_points_per_egp', '1', 'Loyalty points earned per EGP spent'),
  ('loyalty_points_value', '0.10', 'EGP value per loyalty point'),
  ('max_delivery_radius_km', '15', 'Maximum delivery radius in km'),
  ('default_delivery_fee', '15', 'Default delivery fee in EGP'),
  ('supported_cities', '["المنيا"]', 'Currently supported cities'),
  ('maintenance_mode', 'false', 'Platform maintenance mode');

-- Restaurant categories
INSERT INTO restaurant_categories (name_ar, name_en, display_order) VALUES
  ('برجر', 'Burgers', 1),
  ('بيتزا', 'Pizza', 2),
  ('مأكولات مصرية', 'Egyptian Food', 3),
  ('دجاج', 'Chicken', 4),
  ('مأكولات بحرية', 'Seafood', 5),
  ('سندوتشات', 'Sandwiches', 6),
  ('حلويات', 'Desserts', 7),
  ('عصائر ومشروبات', 'Juices & Drinks', 8),
  ('مشويات', 'Grills', 9),
  ('سلطات', 'Salads', 10),
  ('مأكولات آسيوية', 'Asian Food', 11),
  ('كافيه', 'Cafe', 12);

-- Delivery zones for Minya
INSERT INTO delivery_zones (name_ar, city, polygon_coordinates, base_delivery_fee, fee_per_km) VALUES
  ('وسط المنيا', 'المنيا', '[]', 10.00, 1.50),
  ('كورنيش النيل', 'المنيا', '[]', 10.00, 1.50),
  ('المنيا الجديدة', 'المنيا', '[]', 15.00, 2.00);
