-- =====================================================
-- سُفرة واحدة — Schema Fix: coupon_usages PK + postgis fallback
-- Apply this patch on top of schema.sql if postgis is unavailable
-- =====================================================

-- Fix: Add explicit PK to coupon_usages (missed in original schema)
ALTER TABLE coupon_usages ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT uuid_generate_v4();

-- Fix: Add missing unique constraint on driver_profiles user_id (already has UNIQUE but ensure)
-- Already present, no action needed.

-- Fix: Ensure polygon_coordinates has a default for zones where coordinates are TBD
ALTER TABLE delivery_zones ALTER COLUMN polygon_coordinates SET DEFAULT '[]'::jsonb;

-- Additional indexes missed in original schema
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_restaurants_open ON restaurants(is_open) WHERE is_open = TRUE;
CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id) WHERE is_revoked = FALSE;
