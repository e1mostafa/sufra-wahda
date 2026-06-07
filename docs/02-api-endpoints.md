# سُفرة واحدة — Complete API Reference

## Base URL
```
Production: https://api.sufra-wahda.com/api/v1
Staging:    https://staging-api.sufra-wahda.com/api/v1
```

## Authentication
All protected endpoints require: `Authorization: Bearer {jwt_token}`

---

## 🔐 AUTH MODULE

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | ❌ | Register new customer |
| POST | /auth/login | ❌ | Login with phone + password |
| POST | /auth/send-otp | ❌ | Send OTP to phone |
| POST | /auth/verify-otp | ❌ | Verify OTP code |
| POST | /auth/refresh-token | ❌ | Refresh JWT token |
| POST | /auth/logout | ✅ | Revoke refresh token |
| POST | /auth/forgot-password | ❌ | Send reset code |
| POST | /auth/reset-password | ❌ | Reset password with code |
| GET | /auth/me | ✅ | Get current user profile |
| PUT | /auth/me | ✅ | Update profile |
| PUT | /auth/change-password | ✅ | Change password |
| POST | /auth/upload-avatar | ✅ | Upload profile picture |

---

## 🏪 RESTAURANTS MODULE

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /restaurants | ❌ | List restaurants (paginated) |
| GET | /restaurants/featured | ❌ | Featured restaurants |
| GET | /restaurants/sponsored | ❌ | Sponsored restaurants |
| GET | /restaurants/nearby | ❌ | Nearby restaurants (lat/lng) |
| GET | /restaurants/search?q= | ❌ | Search restaurants |
| GET | /restaurants/categories | ❌ | All restaurant categories |
| GET | /restaurants/by-category/{id} | ❌ | Restaurants by category |
| GET | /restaurants/{id} | ❌ | Restaurant details |
| GET | /restaurants/{id}/menu | ❌ | Restaurant full menu |
| GET | /restaurants/{id}/reviews | ❌ | Restaurant reviews |
| GET | /restaurants/{id}/is-open | ❌ | Check if restaurant is open |
| POST | /restaurants | ✅ (Owner) | Register restaurant |
| PUT | /restaurants/{id} | ✅ (Owner) | Update restaurant |
| PUT | /restaurants/{id}/open-status | ✅ (Owner) | Toggle open/close |
| POST | /restaurants/{id}/images | ✅ (Owner) | Upload restaurant images |
| DELETE | /restaurants/{id}/images/{imgId} | ✅ (Owner) | Delete image |

---

## 🍽️ MENU MODULE

### Menu Categories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /restaurants/{id}/menu-categories | ❌ | List menu categories |
| POST | /restaurants/{id}/menu-categories | ✅ (Owner) | Create category |
| PUT | /menu-categories/{id} | ✅ (Owner) | Update category |
| DELETE | /menu-categories/{id} | ✅ (Owner) | Delete category |
| PUT | /menu-categories/reorder | ✅ (Owner) | Reorder categories |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /menu-categories/{id}/products | ❌ | List products in category |
| GET | /products/{id} | ❌ | Product details |
| POST | /products | ✅ (Owner) | Create product |
| PUT | /products/{id} | ✅ (Owner) | Update product |
| DELETE | /products/{id} | ✅ (Owner) | Soft delete product |
| PUT | /products/{id}/availability | ✅ (Owner) | Toggle availability |
| POST | /products/{id}/image | ✅ (Owner) | Upload product image |
| POST | /products/{id}/options | ✅ (Owner) | Add product option |
| PUT | /products/options/{optId} | ✅ (Owner) | Update option |
| DELETE | /products/options/{optId} | ✅ (Owner) | Delete option |
| POST | /products/options/{optId}/values | ✅ (Owner) | Add option value |
| PUT | /products/options/values/{valId} | ✅ (Owner) | Update option value |

---

## 🛒 CART MODULE

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /cart | ✅ (Customer) | Get cart |
| POST | /cart/items | ✅ (Customer) | Add item to cart |
| PUT | /cart/items/{id} | ✅ (Customer) | Update item quantity |
| DELETE | /cart/items/{id} | ✅ (Customer) | Remove item from cart |
| DELETE | /cart | ✅ (Customer) | Clear cart |
| POST | /cart/validate-coupon | ✅ (Customer) | Validate coupon code |
| GET | /cart/delivery-fee | ✅ (Customer) | Calculate delivery fee |

---

## 📦 ORDERS MODULE

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /orders | ✅ (Customer) | Customer order history |
| GET | /orders/{id} | ✅ | Order details |
| POST | /orders | ✅ (Customer) | Place new order |
| POST | /orders/{id}/cancel | ✅ (Customer) | Cancel order |
| GET | /orders/{id}/tracking | ✅ (Customer) | Live order tracking |
| POST | /orders/{id}/review | ✅ (Customer) | Submit review |

### Restaurant Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /restaurant/orders | ✅ (Owner) | Restaurant order list |
| GET | /restaurant/orders/active | ✅ (Owner) | Active orders |
| PUT | /restaurant/orders/{id}/confirm | ✅ (Owner) | Confirm order |
| PUT | /restaurant/orders/{id}/reject | ✅ (Owner) | Reject order |
| PUT | /restaurant/orders/{id}/ready | ✅ (Owner) | Mark ready for pickup |

### Driver Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /driver/orders/available | ✅ (Driver) | Available orders nearby |
| POST | /driver/orders/{id}/accept | ✅ (Driver) | Accept delivery |
| PUT | /driver/orders/{id}/picked-up | ✅ (Driver) | Mark as picked up |
| PUT | /driver/orders/{id}/delivered | ✅ (Driver) | Mark as delivered |
| PUT | /driver/location | ✅ (Driver) | Update GPS location |
| PUT | /driver/online-status | ✅ (Driver) | Toggle online/offline |

---

## 💳 PAYMENTS MODULE

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /payments/initiate | ✅ (Customer) | Initiate payment |
| POST | /payments/fawry/callback | ❌ | Fawry payment webhook |
| POST | /payments/stripe/webhook | ❌ | Stripe webhook |
| GET | /payments/{orderId}/status | ✅ | Payment status |

---

## 📍 ADDRESSES MODULE

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /addresses | ✅ (Customer) | List my addresses |
| POST | /addresses | ✅ (Customer) | Add address |
| PUT | /addresses/{id} | ✅ (Customer) | Update address |
| DELETE | /addresses/{id} | ✅ (Customer) | Delete address |
| PUT | /addresses/{id}/default | ✅ (Customer) | Set as default |
| POST | /addresses/geocode | ✅ | Geocode address string |

---

## ❤️ FAVORITES MODULE

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /favorites/restaurants | ✅ (Customer) | Favorite restaurants |
| POST | /favorites/restaurants/{id} | ✅ (Customer) | Add to favorites |
| DELETE | /favorites/restaurants/{id} | ✅ (Customer) | Remove from favorites |
| GET | /favorites/products | ✅ (Customer) | Favorite products |
| POST | /favorites/products/{id} | ✅ (Customer) | Add product to favorites |
| DELETE | /favorites/products/{id} | ✅ (Customer) | Remove product from favorites |

---

## 🔔 NOTIFICATIONS MODULE

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /notifications | ✅ | List notifications |
| PUT | /notifications/{id}/read | ✅ | Mark as read |
| PUT | /notifications/read-all | ✅ | Mark all as read |
| POST | /push-tokens | ✅ | Register push token |
| DELETE | /push-tokens/{token} | ✅ | Remove push token |

---

## 🚗 DRIVER MODULE

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /driver/register | ✅ | Register as driver |
| GET | /driver/profile | ✅ (Driver) | Driver profile |
| PUT | /driver/profile | ✅ (Driver) | Update profile |
| GET | /driver/earnings | ✅ (Driver) | Earnings summary |
| GET | /driver/earnings/history | ✅ (Driver) | Earnings history |
| GET | /driver/deliveries | ✅ (Driver) | Delivery history |
| POST | /driver/documents | ✅ (Driver) | Upload ID/license |

---

## 📊 ANALYTICS MODULE

### Restaurant Analytics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /restaurant/analytics/overview | ✅ (Owner) | Revenue overview |
| GET | /restaurant/analytics/orders | ✅ (Owner) | Order analytics |
| GET | /restaurant/analytics/top-products | ✅ (Owner) | Best sellers |
| GET | /restaurant/analytics/revenue | ✅ (Owner) | Revenue by period |
| GET | /restaurant/analytics/customers | ✅ (Owner) | Customer stats |

---

## 👑 ADMIN MODULE

### Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /admin/dashboard | ✅ (Admin) | Platform overview |
| GET | /admin/analytics/revenue | ✅ (Admin) | Revenue analytics |
| GET | /admin/analytics/orders | ✅ (Admin) | Order analytics |

### Restaurant Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /admin/restaurants | ✅ (Admin) | All restaurants |
| GET | /admin/restaurants/pending | ✅ (Admin) | Pending approval |
| PUT | /admin/restaurants/{id}/approve | ✅ (Admin) | Approve restaurant |
| PUT | /admin/restaurants/{id}/reject | ✅ (Admin) | Reject restaurant |
| PUT | /admin/restaurants/{id}/suspend | ✅ (Admin) | Suspend restaurant |
| PUT | /admin/restaurants/{id}/commission | ✅ (Admin) | Update commission |

### User Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /admin/customers | ✅ (Admin) | All customers |
| GET | /admin/drivers | ✅ (Admin) | All drivers |
| PUT | /admin/drivers/{id}/approve | ✅ (Admin) | Approve driver |
| PUT | /admin/users/{id}/suspend | ✅ (Admin) | Suspend user |

### Coupon Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /admin/coupons | ✅ (Admin) | All coupons |
| POST | /admin/coupons | ✅ (Admin) | Create coupon |
| PUT | /admin/coupons/{id} | ✅ (Admin) | Update coupon |
| DELETE | /admin/coupons/{id} | ✅ (Admin) | Delete coupon |

### Advertisement Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /admin/ads | ✅ (Admin) | All ads |
| POST | /admin/ads | ✅ (Admin) | Create ad |
| PUT | /admin/ads/{id} | ✅ (Admin) | Update ad |
| DELETE | /admin/ads/{id} | ✅ (Admin) | Delete ad |

### Payout Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /admin/payouts/restaurants | ✅ (Admin) | Restaurant payouts |
| POST | /admin/payouts/restaurants/{id}/process | ✅ (Admin) | Process payout |
| GET | /admin/payouts/drivers | ✅ (Admin) | Driver payouts |

### Platform Settings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /admin/settings | ✅ (Admin) | Platform settings |
| PUT | /admin/settings | ✅ (Admin) | Update settings |

---

## 🗺️ LOCATION MODULE

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /location/delivery-zones | ❌ | List delivery zones |
| POST | /location/calculate-fee | ❌ | Calculate delivery fee |
| GET | /location/check-coverage | ❌ | Check if address is covered |

---

## SignalR Hubs

| Hub | URL | Events |
|-----|-----|--------|
| OrderHub | /hubs/orders | OrderStatusChanged, DriverLocationUpdated |
| NotificationHub | /hubs/notifications | NewNotification |
| RestaurantHub | /hubs/restaurant | NewOrder, OrderCancelled |

---

## Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "تم بنجاح",
  "errors": null,
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 150,
    "totalPages": 8
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 422 | Unprocessable Entity |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |
