# 🍽️ سُفرة واحدة — Food Delivery Platform

<div align="center">

![سُفرة واحدة](https://img.shields.io/badge/سُفرة_واحدة-v1.0.0-7B1E3A?style=for-the-badge)
![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?style=for-the-badge&logo=dotnet)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql)

**منصة طلب وتوصيل الطعام الأولى في المنيا، مصر**

[Customer Web](http://localhost:3000) • [Restaurant Dashboard](http://localhost:3001) • [Admin Panel](http://localhost:3002) • [Driver Panel](http://localhost:3003) • [API Docs](http://localhost:5000/swagger)

</div>

---

## 📋 جدول المحتويات

- [نظرة عامة](#نظرة-عامة)
- [المتطلبات](#المتطلبات)
- [التثبيت السريع](#التثبيت-السريع)
- [التثبيت اليدوي](#التثبيت-اليدوي)
- [المتغيرات البيئية](#المتغيرات-البيئية)
- [قاعدة البيانات](#قاعدة-البيانات)
- [الـ API Endpoints](#api-endpoints)
- [Checklist الاختبار](#checklist-الاختبار)
- [النشر للإنتاج](#النشر-للإنتاج)
- [بيانات الدخول التجريبية](#بيانات-الدخول-التجريبية)

---

## 🌟 نظرة عامة

**سُفرة واحدة** منصة متكاملة لطلب وتوصيل الطعام تتضمن:

| التطبيق | المنفذ | الوصف |
|---------|--------|-------|
| 🛒 Customer Web | 3000 | واجهة العملاء — تصفح وطلب وتتبع |
| 🏪 Restaurant Dashboard | 3001 | لوحة المطعم — إدارة الطلبات والقائمة |
| 🛡️ Admin Panel | 3002 | لوحة الإدارة — إدارة المنصة كاملة |
| 🛵 Driver Panel | 3003 | تطبيق السائق (PWA) — استلام وتوصيل |
| ⚙️ Backend API | 5000 | ASP.NET Core 8 — Clean Architecture |

### 🏗️ المعمارية

```
┌─────────────────────────────────────────────┐
│           NGINX (Reverse Proxy + SSL)         │
└──────┬──────┬──────┬──────┬──────────────────┘
       │      │      │      │
   :3000  :3001  :3002  :3003
   Customer Rest.  Admin Driver
       │      │      │      │
       └──────┴──────┴──────┘
                  │
            :5000 API (ASP.NET Core 8)
                  │
          ┌───────┴────────┐
      PostgreSQL          Redis
         :5432             :6379
```

### 📦 التقنيات

**Backend:** ASP.NET Core 8, Clean Architecture, CQRS (MediatR), EF Core 8, FluentValidation, SignalR, Serilog, Hangfire

**Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, React Query, Framer Motion

**Infrastructure:** Docker, PostgreSQL 16, Redis 7, Cloudinary, Firebase FCM, Nginx, GitHub Actions

---

## ✅ المتطلبات

### للتطوير المحلي:
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org)
- [PostgreSQL 16](https://www.postgresql.org/download/) أو Docker
- [Redis 7](https://redis.io/download/) أو Docker (اختياري)
- [Git](https://git-scm.com)

### للـ Docker (موصى به):
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Docker Compose V2](https://docs.docker.com/compose/install/)

---

## 🚀 التثبيت السريع (Docker)

```bash
# 1. استنساخ المشروع
git clone https://github.com/your-org/sufra-wahda.git
cd sufra-wahda

# 2. نسخ ملف المتغيرات البيئية
cp .env.example .env
# عدّل .env بقيمك الفعلية

# 3. تشغيل قاعدة البيانات فقط (للتطوير)
docker-compose -f deployment/docker-compose.yml up postgres redis -d

# 4. تشغيل النظام كاملاً
docker-compose -f deployment/docker-compose.yml up -d

# 5. التحقق من التشغيل
docker-compose -f deployment/docker-compose.yml ps
```

---

## 🔧 التثبيت اليدوي

### 1. إعداد قاعدة البيانات

```bash
# أنشئ قاعدة البيانات
psql -U postgres -c "CREATE DATABASE sufra_wahda_dev;"

# شغّل الـ schema
psql -U postgres -d sufra_wahda_dev -f database/schema.sql
psql -U postgres -d sufra_wahda_dev -f database/schema-fixes.sql

# شغّل البيانات التجريبية
psql -U postgres -d sufra_wahda_dev -f database/seed.sql
```

### 2. تشغيل الـ Backend

```bash
cd backend

# استعادة الـ packages
dotnet restore

# إنشاء migrations (أول مرة فقط)
cd src/SufraWahda.API
dotnet ef migrations add InitialCreate \
  --project ../SufraWahda.Infrastructure \
  --startup-project .

# تطبيق الـ migrations
dotnet ef database update \
  --project ../SufraWahda.Infrastructure \
  --startup-project .

# تشغيل الـ API
dotnet run --project src/SufraWahda.API
# API متاح على: http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

### 3. تشغيل Customer Web

```bash
cd frontend/customer-web

# تثبيت الـ packages
npm install

# تشغيل development server
npm run dev
# متاح على: http://localhost:3000
```

### 4. تشغيل Restaurant Dashboard

```bash
cd frontend/restaurant-dashboard
npm install
npm run dev
# متاح على: http://localhost:3001
```

### 5. تشغيل Admin Panel

```bash
cd frontend/admin-panel
npm install
npm run dev
# متاح على: http://localhost:3002
```

### 6. تشغيل Driver Panel

```bash
cd frontend/driver-panel
npm install
npm run dev
# متاح على: http://localhost:3003
```

---

## 🔐 المتغيرات البيئية

### Backend (`appsettings.json`)

| المتغير | الوصف | مثال |
|---------|-------|-------|
| `ConnectionStrings:DefaultConnection` | PostgreSQL connection | `Host=localhost;...` |
| `ConnectionStrings:Redis` | Redis connection | `localhost:6379` |
| `Jwt:Secret` | JWT secret (32+ chars) | `your-super-secret-key...` |
| `Cloudinary:CloudName` | اسم حساب Cloudinary | `your-cloud-name` |
| `Vonage:ApiKey` | مفتاح Vonage SMS | `abc123` |
| `Fawry:MerchantCode` | كود تاجر فوري | `123456` |

### Frontend (`.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SIGNALR_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_key
```

---

## 🗄️ قاعدة البيانات

### EF Core Migrations

```bash
cd backend

# إضافة migration جديدة
dotnet ef migrations add MigrationName \
  --project src/SufraWahda.Infrastructure \
  --startup-project src/SufraWahda.API

# تطبيق الـ migrations
dotnet ef database update \
  --project src/SufraWahda.Infrastructure \
  --startup-project src/SufraWahda.API

# التراجع عن آخر migration
dotnet ef migrations remove \
  --project src/SufraWahda.Infrastructure \
  --startup-project src/SufraWahda.API
```

### Seed Data

```bash
# تشغيل الـ seed يدوياً
psql -U postgres -d sufra_wahda_dev -f database/seed.sql
```

---

## 📡 API Endpoints الرئيسية

| Method | Endpoint | الوصف |
|--------|----------|-------|
| POST | `/api/v1/auth/register` | تسجيل عميل جديد |
| POST | `/api/v1/auth/login` | تسجيل دخول |
| POST | `/api/v1/auth/send-otp` | إرسال OTP |
| GET  | `/api/v1/restaurants` | قائمة المطاعم |
| GET  | `/api/v1/restaurants/{id}` | تفاصيل مطعم |
| POST | `/api/v1/orders` | إنشاء طلب |
| GET  | `/api/v1/orders` | طلباتي |
| PUT  | `/api/v1/restaurant/orders/{id}/confirm` | قبول طلب |

📖 **Swagger UI:** `http://localhost:5000/swagger`

---

## ✅ Checklist الاختبار

### 🔐 Auth
- [ ] تسجيل عميل جديد بنجاح
- [ ] تسجيل دخول بالهاتف وكلمة المرور
- [ ] تلقي OTP على الهاتف
- [ ] التحقق من OTP وتفعيل الحساب
- [ ] JWT يعمل بشكل صحيح (15 دقيقة)
- [ ] Refresh Token يجدد الـ JWT

### 🏪 المطاعم
- [ ] عرض قائمة المطاعم في الصفحة الرئيسية
- [ ] البحث في المطاعم يعمل
- [ ] فلترة حسب التصنيف تعمل
- [ ] صفحة تفاصيل المطعم تعرض القائمة كاملة
- [ ] إضافة للمفضلة تعمل (للمستخدمين المسجلين)

### 🛒 السلة والطلبات
- [ ] إضافة منتج للسلة
- [ ] تعديل الكمية في السلة
- [ ] حذف منتج من السلة
- [ ] كوبون الخصم يعمل (جرب: `سُفرة50`)
- [ ] إتمام الطلب بالكاش يعمل
- [ ] ظهور الطلب في لوحة المطعم

### 🏪 لوحة المطعم
- [ ] تسجيل دخول بحساب المطعم
- [ ] استقبال الطلبات الجديدة
- [ ] قبول طلب وتحديث حالته
- [ ] رفض طلب مع سبب
- [ ] تغيير حالة المطعم (مفتوح/مغلق)
- [ ] عرض إحصائيات اليوم

### 🛡️ لوحة الإدارة
- [ ] تسجيل دخول المدير
- [ ] عرض إحصائيات المنصة
- [ ] الموافقة على مطعم جديد
- [ ] رفض مطعم مع سبب
- [ ] عرض قائمة العملاء
- [ ] تعليق حساب مستخدم

### 🛵 تطبيق السائق
- [ ] تسجيل دخول السائق
- [ ] تفعيل حالة "متصل"
- [ ] عرض الطلبات المتاحة
- [ ] قبول توصيلة
- [ ] تحديث حالة التوصيل
- [ ] عرض الأرباح

### 📡 Real-time
- [ ] إشعار المطعم عند طلب جديد
- [ ] تحديث حالة الطلب للعميل لحظياً

---

## 🌐 النشر للإنتاج

### Railway (موصى به)

```bash
# Backend
cd backend
railway up

# Frontends (كل واحد منفرد)
cd frontend/customer-web
railway up
```

### Docker Compose (VPS)

```bash
# على الـ server
git clone https://github.com/your-org/sufra-wahda.git
cd sufra-wahda
cp .env.example .env
nano .env  # عدّل القيم

# تشغيل النظام
docker-compose -f deployment/docker-compose.yml up -d

# SSL مع Certbot
docker run --rm -v certbot_data:/etc/letsencrypt certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  -d sufra-wahda.com -d www.sufra-wahda.com \
  -d api.sufra-wahda.com \
  --email admin@sufra-wahda.com \
  --agree-tos --non-interactive
```

---

## 👤 بيانات الدخول التجريبية

> ⚠️ للتطوير فقط — لا تستخدم في الإنتاج

| الدور | الهاتف | كلمة المرور |
|-------|--------|------------|
| 🛡️ مدير | `01000000001` | `Sufra@2025` |
| 🏪 صاحب مطعم | `01011111111` | `Sufra@2025` |
| 🛵 سائق | `01044444444` | `Sufra@2025` |
| 👤 عميل | `01066666666` | `Sufra@2025` |

---

## 🏗️ هيكل المشروع

```
sufra-wahda/
├── backend/                    # ASP.NET Core 8 API
│   └── src/
│       ├── SufraWahda.Domain/      # Entities, Enums, Interfaces
│       ├── SufraWahda.Application/ # CQRS, DTOs, Business Logic
│       ├── SufraWahda.Infrastructure/ # EF Core, Services, Repositories
│       └── SufraWahda.API/         # Controllers, Middleware, Program.cs
├── frontend/
│   ├── customer-web/           # Next.js 14 — موقع العملاء
│   ├── restaurant-dashboard/   # Next.js 14 — لوحة المطعم
│   ├── admin-panel/           # Next.js 14 — لوحة الإدارة
│   └── driver-panel/          # Next.js 14 PWA — تطبيق السائق
├── database/
│   ├── schema.sql             # قاعدة البيانات الكاملة
│   ├── schema-fixes.sql       # إصلاحات وـ indexes إضافية
│   └── seed.sql               # بيانات تجريبية
├── deployment/
│   ├── docker-compose.yml     # Production deployment
│   ├── docker-compose.override.yml # Development overrides
│   └── nginx/nginx.conf       # Nginx configuration
├── docs/                      # توثيق تقني شامل
├── .env.example               # مثال المتغيرات البيئية
└── .github/workflows/ci-cd.yml # GitHub Actions CI/CD
```

---

## 📞 الدعم

- **البريد:** dev@sufra-wahda.com
- **الموقع:** sufra-wahda.com
- **المدينة:** المنيا، مصر 🇪🇬

---

<div align="center">
صُنع بـ ❤️ في المنيا، مصر — سُفرة واحدة © 2025
</div>
