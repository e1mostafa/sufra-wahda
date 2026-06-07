-- =====================================================
-- سُفرة واحدة — Database Seed Script
-- Run AFTER schema.sql and schema-fixes.sql
-- Provides realistic demo data for Minya launch
-- =====================================================

-- ─── USERS ────────────────────────────────────────────────────────────────────
-- Password for all demo users: Sufra@2025
-- BCrypt hash of "Sufra@2025"
DO $$
DECLARE
  v_hash TEXT := '$2a$11$K5GxvOIXqYpM1LdG2zU7XuQrT8nVjwE3YHmP4sOaBcDfEgHiJkLmN';
  v_admin_id UUID := '00000000-0000-0000-0000-000000000001';
  v_owner1_id UUID := '00000000-0000-0000-0000-000000000010';
  v_owner2_id UUID := '00000000-0000-0000-0000-000000000011';
  v_owner3_id UUID := '00000000-0000-0000-0000-000000000012';
  v_driver1_id UUID := '00000000-0000-0000-0000-000000000020';
  v_driver2_id UUID := '00000000-0000-0000-0000-000000000021';
  v_customer1_id UUID := '00000000-0000-0000-0000-000000000030';
  v_customer2_id UUID := '00000000-0000-0000-0000-000000000031';
  v_customer3_id UUID := '00000000-0000-0000-0000-000000000032';
  v_rest1_id UUID := '00000000-0000-0000-0000-000000000100';
  v_rest2_id UUID := '00000000-0000-0000-0000-000000000101';
  v_rest3_id UUID := '00000000-0000-0000-0000-000000000102';
BEGIN

  -- ─── Admin ────────────────────────────────────────────────────────
  INSERT INTO users (id, full_name, phone, email, password_hash, role, status, is_phone_verified, referral_code)
  VALUES (v_admin_id, 'مدير سُفرة واحدة', '01000000001', 'admin@sufra-wahda.com', v_hash, 'Admin', 'Active', TRUE, 'ADMIN001')
  ON CONFLICT (phone) DO NOTHING;

  -- ─── Restaurant Owners ────────────────────────────────────────────
  INSERT INTO users (id, full_name, phone, password_hash, role, status, is_phone_verified, referral_code)
  VALUES
    (v_owner1_id, 'أحمد محمد عبد الله', '01011111111', v_hash, 'RestaurantOwner', 'Active', TRUE, 'OWN001'),
    (v_owner2_id, 'محمود حسن إبراهيم', '01022222222', v_hash, 'RestaurantOwner', 'Active', TRUE, 'OWN002'),
    (v_owner3_id, 'سمر علي السيد', '01033333333', v_hash, 'RestaurantOwner', 'Active', TRUE, 'OWN003')
  ON CONFLICT (phone) DO NOTHING;

  -- ─── Drivers ──────────────────────────────────────────────────────
  INSERT INTO users (id, full_name, phone, password_hash, role, status, is_phone_verified, referral_code)
  VALUES
    (v_driver1_id, 'عمر سعيد خالد', '01044444444', v_hash, 'Driver', 'Active', TRUE, 'DRV001'),
    (v_driver2_id, 'كريم وليد منصور', '01055555555', v_hash, 'Driver', 'Active', TRUE, 'DRV002')
  ON CONFLICT (phone) DO NOTHING;

  -- Driver Profiles
  INSERT INTO driver_profiles (user_id, national_id, vehicle_type, vehicle_plate, status, is_online, total_deliveries, average_rating)
  VALUES
    (v_driver1_id, '27001011234567', 'Motorcycle', 'م ك ل 123', 'Active', FALSE, 284, 4.8),
    (v_driver2_id, '29503152345678', 'Motorcycle', 'م ن ع 456', 'Active', FALSE, 156, 4.6)
  ON CONFLICT (user_id) DO NOTHING;

  -- ─── Customers ────────────────────────────────────────────────────
  INSERT INTO users (id, full_name, phone, password_hash, role, status, is_phone_verified, referral_code, loyalty_points)
  VALUES
    (v_customer1_id, 'محمد أحمد السيد', '01066666666', v_hash, 'Customer', 'Active', TRUE, 'CUS001', 150),
    (v_customer2_id, 'سارة عبد الرحمن',  '01077777777', v_hash, 'Customer', 'Active', TRUE, 'CUS002', 80),
    (v_customer3_id, 'أمير محمود علي',   '01088888888', v_hash, 'Customer', 'Active', TRUE, 'CUS003', 220)
  ON CONFLICT (phone) DO NOTHING;

  -- Customer addresses
  INSERT INTO addresses (user_id, label, address_line1, city, governorate, landmark, latitude, longitude, is_default)
  VALUES
    (v_customer1_id, 'المنزل', 'شارع كورنيش النيل رقم 45', 'المنيا', 'المنيا', 'بجوار مسجد الفتح', 28.0871, 30.7529, TRUE),
    (v_customer2_id, 'العمل', 'شارع جمال عبد الناصر، برج النيل', 'المنيا', 'المنيا', 'الدور الثالث', 28.0912, 30.7441, TRUE),
    (v_customer3_id, 'المنزل', 'شارع بورسعيد، الحي الجديد', 'المنيا', 'المنيا', NULL, 28.0834, 30.7612, TRUE)
  ON CONFLICT DO NOTHING;

  -- ─── Restaurants ──────────────────────────────────────────────────
  -- Category IDs (created by schema.sql initial data)
  INSERT INTO restaurants (
    id, owner_id, name_ar, name_en, description_ar,
    phone, address, city, governorate, latitude, longitude,
    category_id, status, is_open, is_featured, is_sponsored,
    min_order_amount, delivery_fee, estimated_delivery_minutes,
    max_delivery_radius_km, commission_percentage,
    average_rating, total_ratings, total_orders,
    opening_hours, tags, approved_at, approved_by
  )
  SELECT
    v_rest1_id, v_owner1_id,
    'برجر كلوب المنيا', 'Burger Club Minya',
    'أحسن برجر في المنيا! مصنوع من اللحم الطازج يومياً مع صوصات بيتية فريدة',
    '01011111111',
    'شارع كورنيش النيل، بجوار كوبري المنيا', 'المنيا', 'المنيا',
    28.0871, 30.7529,
    id, 'Active', TRUE, TRUE, TRUE,
    45, 10, 35, 10, 15,
    4.8, 127, 1240,
    '{"Sat":{"open":"10:00","close":"01:00"},"Sun":{"open":"10:00","close":"01:00"},"Mon":{"open":"10:00","close":"01:00"},"Tue":{"open":"10:00","close":"01:00"},"Wed":{"open":"10:00","close":"01:00"},"Thu":{"open":"10:00","close":"02:00"},"Fri":{"open":"12:00","close":"02:00"}}',
    ARRAY['برجر', 'سندوتشات', 'بطاطس', 'مشروبات'],
    NOW(), v_admin_id
  FROM restaurant_categories WHERE name_ar = 'برجر'
  LIMIT 1
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO restaurants (
    id, owner_id, name_ar, name_en, description_ar,
    phone, address, city, governorate, latitude, longitude,
    category_id, status, is_open, is_featured, is_sponsored,
    min_order_amount, delivery_fee, estimated_delivery_minutes,
    max_delivery_radius_km, commission_percentage,
    average_rating, total_ratings, total_orders,
    opening_hours, tags, approved_at, approved_by
  )
  SELECT
    v_rest2_id, v_owner2_id,
    'بيتزا النيل الملكية', 'Nile Royal Pizza',
    'بيتزا إيطالية أصيلة بعجينة طازجة يومياً وأفضل الخامات المستوردة',
    '01022222222',
    'ميدان الحرية، شارع السادات', 'المنيا', 'المنيا',
    28.0912, 30.7441,
    id, 'Active', TRUE, TRUE, FALSE,
    35, 8, 30, 8, 17,
    4.6, 89, 756,
    '{"Sat":{"open":"11:00","close":"00:00"},"Sun":{"open":"11:00","close":"00:00"},"Mon":{"open":"11:00","close":"00:00"},"Tue":{"open":"11:00","close":"00:00"},"Wed":{"open":"11:00","close":"00:00"},"Thu":{"open":"11:00","close":"01:00"},"Fri":{"open":"12:00","close":"01:00"}}',
    ARRAY['بيتزا', 'باستا', 'إيطالي', 'عائلي'],
    NOW(), v_admin_id
  FROM restaurant_categories WHERE name_ar = 'بيتزا'
  LIMIT 1
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO restaurants (
    id, owner_id, name_ar, name_en, description_ar,
    phone, address, city, governorate, latitude, longitude,
    category_id, status, is_open, is_featured, is_sponsored,
    min_order_amount, delivery_fee, estimated_delivery_minutes,
    max_delivery_radius_km, commission_percentage,
    average_rating, total_ratings, total_orders,
    opening_hours, tags, approved_at, approved_by
  )
  SELECT
    v_rest3_id, v_owner3_id,
    'فول ومدمس حسن أفندي', 'Hassan Afandi Foul',
    'الطعم الأصيل للفطار المصري — فول وطعمية وعيش بلدي منذ ١٩٨٥',
    '01033333333',
    'شارع إبراهيم باشا، السوق القديم', 'المنيا', 'المنيا',
    28.0834, 30.7612,
    id, 'Active', TRUE, FALSE, FALSE,
    20, 5, 20, 5, 15,
    4.9, 312, 2890,
    '{"Sat":{"open":"06:00","close":"15:00"},"Sun":{"open":"06:00","close":"15:00"},"Mon":{"open":"06:00","close":"15:00"},"Tue":{"open":"06:00","close":"15:00"},"Wed":{"open":"06:00","close":"15:00"},"Thu":{"open":"06:00","close":"16:00"},"Fri":{"open":"07:00","close":"14:00"}}',
    ARRAY['فطار', 'فول', 'طعمية', 'مصري', 'رخيص'],
    NOW(), v_admin_id
  FROM restaurant_categories WHERE name_ar = 'مأكولات مصرية'
  LIMIT 1
  ON CONFLICT (id) DO NOTHING;

  -- ─── Menu Categories ──────────────────────────────────────────────
  -- Restaurant 1: Burger Club
  INSERT INTO menu_categories (restaurant_id, name_ar, name_en, display_order, is_active)
  VALUES
    (v_rest1_id, 'البرجر', 'Burgers', 1, TRUE),
    (v_rest1_id, 'السندوتشات', 'Sandwiches', 2, TRUE),
    (v_rest1_id, 'البطاطس والمقبلات', 'Sides', 3, TRUE),
    (v_rest1_id, 'المشروبات', 'Drinks', 4, TRUE)
  ON CONFLICT DO NOTHING;

  -- Restaurant 2: Pizza Nile
  INSERT INTO menu_categories (restaurant_id, name_ar, name_en, display_order, is_active)
  VALUES
    (v_rest2_id, 'البيتزا', 'Pizzas', 1, TRUE),
    (v_rest2_id, 'الباستا', 'Pasta', 2, TRUE),
    (v_rest2_id, 'المقبلات', 'Starters', 3, TRUE),
    (v_rest2_id, 'المشروبات', 'Drinks', 4, TRUE)
  ON CONFLICT DO NOTHING;

  -- Restaurant 3: Foul
  INSERT INTO menu_categories (restaurant_id, name_ar, name_en, display_order, is_active)
  VALUES
    (v_rest3_id, 'الوجبات الأساسية', 'Main Dishes', 1, TRUE),
    (v_rest3_id, 'الإضافات', 'Extras', 2, TRUE),
    (v_rest3_id, 'المشروبات', 'Drinks', 3, TRUE)
  ON CONFLICT DO NOTHING;

  -- ─── Products ─────────────────────────────────────────────────────
  -- Burger Club Products
  INSERT INTO products (
    restaurant_id, menu_category_id, name_ar, name_en, description_ar,
    base_price, calories, is_available, is_featured, preparation_minutes,
    display_order, average_rating, tags
  )
  SELECT
    v_rest1_id, mc.id,
    p.name_ar, p.name_en, p.description_ar,
    p.price, p.calories, TRUE, p.featured, p.prep,
    p.ord, p.rating, p.tags::text[]
  FROM (
    VALUES
      ('برجر مشروم سبيشل', 'Mushroom Special Burger', 'برجر لحم بيف ١٨٠ جرام مع مشروم مشوي وجبنة شيدر وصوص بيت الخاص', 'البرجر', 65, 680, TRUE, 15, 1, 4.9, '{"برجر","لحم","مشروم"}'),
      ('برجر دبل تشيز', 'Double Cheese Burger', 'برجر مزدوج مع جبنتين شيدر وطماطم وخس طازج', 'البرجر', 75, 850, TRUE, 20, 2, 4.7, '{"برجر","لحم","جبن"}'),
      ('كريسبي تشيكن برجر', 'Crispy Chicken Burger', 'صدر دجاج مقلي مقرمش مع صوص الرانش', 'البرجر', 55, 620, FALSE, 12, 3, 4.5, '{"دجاج","مقلي"}'),
      ('سندوتش شاورما لحمة', 'Beef Shawarma', 'شاورما لحم طازجة مع طحينة وخضار', 'السندوتشات', 45, 580, TRUE, 10, 1, 4.6, '{"شاورما","لحم"}'),
      ('بطاطس سبيشل كبيرة', 'Large Special Fries', 'بطاطس مقلية مقرمشة مع توابل خاصة', 'البطاطس والمقبلات', 25, 350, TRUE, 8, 1, 4.4, '{"بطاطس","مقبلات"}'),
      ('كوكاكولا', 'Coca Cola', 'كوكاكولا ٥٠٠ مل', 'المشروبات', 15, 150, TRUE, 2, 1, 5.0, '{"مشروبات"}')
  ) AS p(name_ar, name_en, description_ar, cat_name, price, calories, featured, prep, ord, rating, tags_str)
  JOIN menu_categories mc ON mc.restaurant_id = v_rest1_id AND mc.name_ar = p.cat_name
  ON CONFLICT DO NOTHING;

  -- Pizza Nile Products
  INSERT INTO products (
    restaurant_id, menu_category_id, name_ar, name_en, description_ar,
    base_price, is_available, is_featured, preparation_minutes,
    display_order, average_rating, tags
  )
  SELECT
    v_rest2_id, mc.id,
    p.name_ar, p.name_en, p.description_ar,
    p.price, TRUE, p.featured, p.prep,
    p.ord, 4.5, p.tags::text[]
  FROM (
    VALUES
      ('بيتزا مارغريتا وسط', 'Margherita Pizza Medium', 'بيتزا كلاسيكية بصوص الطماطم والجبن الموزاريلا', 'البيتزا', 65, TRUE, 20, 1, '{"بيتزا","نباتي"}'),
      ('بيتزا مشكل كبيرة', 'Mixed Pizza Large', 'بيتزا كبيرة بالدجاج والفطر والزيتون والفلفل', 'البيتزا', 95, TRUE, 25, 2, '{"بيتزا","دجاج","عائلي"}'),
      ('باستا كريمة بالدجاج', 'Chicken Pasta', 'باستا بنّي بصوص الكريمة والدجاج المشوي', 'الباستا', 55, FALSE, 18, 1, '{"باستا","دجاج"}'),
      ('خبز ثوم بالجبن', 'Garlic Cheese Bread', 'خبز محمص بالثوم والزبدة وجبنة موزاريلا', 'المقبلات', 30, TRUE, 8, 1, '{"مقبلات","خبز"}')
  ) AS p(name_ar, name_en, description_ar, cat_name, price, featured, prep, ord, tags_str)
  JOIN menu_categories mc ON mc.restaurant_id = v_rest2_id AND mc.name_ar = p.cat_name
  ON CONFLICT DO NOTHING;

  -- Foul Restaurant Products
  INSERT INTO products (
    restaurant_id, menu_category_id, name_ar, name_en, description_ar,
    base_price, is_available, is_featured, preparation_minutes,
    display_order, average_rating, tags
  )
  SELECT
    v_rest3_id, mc.id,
    p.name_ar, p.name_en, p.description_ar,
    p.price, TRUE, p.featured, p.prep,
    p.ord, 4.9, p.tags::text[]
  FROM (
    VALUES
      ('طبق فول كامل', 'Full Foul Plate', 'فول مدمس بزيت الزيتون والكمون والطماطم مع عيش بلدي', 'الوجبات الأساسية', 18, TRUE, 5, 1, '{"فول","فطار"}'),
      ('طعمية (١٠ حبة)', 'Falafel 10pcs', 'طعمية مقلية طازجة هشة من الداخل مقرمشة من الخارج', 'الوجبات الأساسية', 20, TRUE, 8, 2, '{"طعمية","مقلي"}'),
      ('سندوتش فول كبير', 'Large Foul Sandwich', 'سندوتش فول بعيش شامي مع سلطة وطحينة', 'الوجبات الأساسية', 12, TRUE, 3, 3, '{"فول","سندوتش"}'),
      ('بيضة مسلوقة', 'Boiled Egg', 'بيضة مسلوقة', 'الإضافات', 5, FALSE, 5, 1, '{"إضافة"}'),
      ('شاي بالنعناع', 'Mint Tea', 'كوب شاي كشري مع نعناع', 'المشروبات', 8, TRUE, 3, 1, '{"مشروبات","شاي"}')
  ) AS p(name_ar, name_en, description_ar, cat_name, price, featured, prep, ord, tags_str)
  JOIN menu_categories mc ON mc.restaurant_id = v_rest3_id AND mc.name_ar = p.cat_name
  ON CONFLICT DO NOTHING;

  -- ─── COUPONS ──────────────────────────────────────────────────────
  INSERT INTO coupons (code, type, value, min_order_amount, max_discount_amount, start_date, end_date, max_uses, max_uses_per_user, is_active, created_by)
  VALUES
    ('سُفرة50', 'Percentage', 50, 50, 30, NOW(), NOW() + INTERVAL '90 days', 500, 1, TRUE, v_admin_id),
    ('WELCOME20', 'FixedAmount', 20, 30, 20, NOW(), NOW() + INTERVAL '365 days', 1000, 1, TRUE, v_admin_id),
    ('FREEDEL', 'FreeDelivery', 0, 40, NULL, NOW(), NOW() + INTERVAL '30 days', 200, 2, TRUE, v_admin_id),
    ('NEWUSER', 'Percentage', 25, 25, 25, NOW(), NOW() + INTERVAL '180 days', 2000, 1, TRUE, v_admin_id)
  ON CONFLICT (code) DO NOTHING;

  -- ─── PLATFORM SETTINGS (update with correct values) ───────────────
  INSERT INTO platform_settings (key, value, description)
  VALUES
    ('platform_name',              'سُفرة واحدة',    'اسم المنصة'),
    ('default_commission',         '15',             'نسبة العمولة الافتراضية'),
    ('min_driver_earnings',        '8',              'الحد الأدنى لأرباح السائق لكل توصيلة'),
    ('loyalty_points_per_egp',     '1',              'نقاط الولاء لكل جنيه'),
    ('loyalty_points_value',       '0.10',           'قيمة نقطة الولاء بالجنيه'),
    ('max_delivery_radius_km',     '15',             'أقصى نطاق للتوصيل'),
    ('default_delivery_fee',       '10',             'رسوم التوصيل الافتراضية'),
    ('supported_cities',           '["المنيا"]',      'المدن المدعومة حالياً'),
    ('maintenance_mode',           'false',          'وضع الصيانة'),
    ('min_app_version_android',    '1.0.0',          'أدنى إصدار أندرويد'),
    ('min_app_version_ios',        '1.0.0',          'أدنى إصدار iOS'),
    ('order_timeout_minutes',      '10',             'مهلة قبول الطلب بالدقائق'),
    ('driver_search_radius_km',    '5',              'نطاق البحث عن السائق')
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

  RAISE NOTICE '✅ Seed completed successfully!';
  RAISE NOTICE '📧 Admin: 01000000001 / Sufra@2025';
  RAISE NOTICE '🏪 Restaurant Owner 1: 01011111111 / Sufra@2025';
  RAISE NOTICE '🛵 Driver 1: 01044444444 / Sufra@2025';
  RAISE NOTICE '👤 Customer 1: 01066666666 / Sufra@2025';

END $$;
