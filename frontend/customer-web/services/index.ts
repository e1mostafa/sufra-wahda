import api from '@/lib/api';
import {
  ApiResponse, AuthResponse, User, RestaurantSummary, RestaurantDetail,
  OrderSummary, OrderDetail, Address, Notification, Review,
  CouponValidation, Pagination
} from '@/types';

// ─── Auth Service ─────────────────────────────────────────────────────────────
export const authService = {
  register: async (data: {
    fullName: string; phone: string; password: string;
    email?: string; referralCode?: string;
  }) => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return res.data;
  },

  login: async (phone: string, password: string) => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', { phone, password });
    return res.data;
  },

  sendOtp: async (phone: string) => {
    const res = await api.post<ApiResponse<string>>('/auth/send-otp', { phone });
    return res.data;
  },

  verifyOtp: async (phone: string, code: string) => {
    const res = await api.post<ApiResponse<boolean>>('/auth/verify-otp', { phone, code });
    return res.data;
  },

  getMe: async () => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const res = await api.put<ApiResponse<User>>('/auth/me', data);
    return res.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await api.put<ApiResponse<boolean>>('/auth/change-password', {
      currentPassword, newPassword
    });
    return res.data;
  },
};

// ─── Restaurant Service ───────────────────────────────────────────────────────
export const restaurantService = {
  getAll: async (params: {
    page?: number; pageSize?: number; search?: string;
    categoryId?: string; city?: string; isOpen?: boolean;
    isFeatured?: boolean; lat?: number; lng?: number;
  } = {}) => {
    const res = await api.get<ApiResponse<RestaurantSummary[]>>('/restaurants', { params });
    return res.data;
  },

  getFeatured: async (limit = 10) => {
    const res = await api.get<ApiResponse<RestaurantSummary[]>>('/restaurants/featured', {
      params: { limit }
    });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<RestaurantDetail>>(`/restaurants/${id}`);
    return res.data;
  },

  getCategories: async () => {
    const res = await api.get<ApiResponse<{ id: string; nameAr: string; iconUrl?: string }[]>>(
      '/restaurants/categories'
    );
    return res.data;
  },

  getAnalytics: async (id: string, days = 7) => {
    const res = await api.get(`/restaurants/${id}/analytics`, { params: { days } });
    return res.data;
  },

  toggleOpen: async (id: string, isOpen: boolean) => {
    const res = await api.put(`/restaurants/${id}/open-status`, { isOpen });
    return res.data;
  },

  getReviews: async (id: string, page = 1) => {
    const res = await api.get<ApiResponse<Review[]>>(`/restaurants/${id}/reviews`, {
      params: { page, pageSize: 10 }
    });
    return res.data;
  },
};

// ─── Order Service ────────────────────────────────────────────────────────────
export const orderService = {
  getMyOrders: async (page = 1, pageSize = 10) => {
    const res = await api.get<ApiResponse<OrderSummary[]>>('/orders', {
      params: { page, pageSize }
    });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<OrderDetail>>(`/orders/${id}`);
    return res.data;
  },

  placeOrder: async (data: {
    restaurantId: string;
    deliveryAddress: string;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
    paymentMethod: string;
    items: { productId: string; quantity: number; selectedOptions?: unknown[]; notes?: string }[];
    couponCode?: string;
    loyaltyPointsToUse?: number;
    customerNotes?: string;
    deliveryNotes?: string;
  }) => {
    const res = await api.post<ApiResponse<OrderSummary>>('/orders', data);
    return res.data;
  },

  cancelOrder: async (id: string) => {
    const res = await api.post<ApiResponse<boolean>>(`/orders/${id}/cancel`);
    return res.data;
  },

  validateCoupon: async (code: string, restaurantId: string, orderAmount: number) => {
    const res = await api.post<ApiResponse<CouponValidation>>('/orders/validate-coupon', {
      code, restaurantId, orderAmount
    });
    return res.data;
  },

  // Restaurant side
  confirmOrder: async (id: string) => {
    const res = await api.put(`/restaurant/orders/${id}/confirm`);
    return res.data;
  },

  rejectOrder: async (id: string, reason: string) => {
    const res = await api.put(`/restaurant/orders/${id}/reject`, { reason });
    return res.data;
  },

  markReady: async (id: string) => {
    const res = await api.put(`/restaurant/orders/${id}/ready`);
    return res.data;
  },
};

// ─── Address Service ──────────────────────────────────────────────────────────
export const addressService = {
  getAll: async () => {
    const res = await api.get<ApiResponse<Address[]>>('/addresses');
    return res.data;
  },

  create: async (data: Omit<Address, 'id'>) => {
    const res = await api.post<ApiResponse<Address>>('/addresses', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Address>) => {
    const res = await api.put<ApiResponse<Address>>(`/addresses/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/addresses/${id}`);
    return res.data;
  },

  setDefault: async (id: string) => {
    const res = await api.put(`/addresses/${id}/default`);
    return res.data;
  },
};

// ─── Notification Service ─────────────────────────────────────────────────────
export const notificationService = {
  getAll: async (page = 1) => {
    const res = await api.get<ApiResponse<Notification[]>>('/notifications', {
      params: { page, pageSize: 20 }
    });
    return res.data;
  },

  markRead: async (id: string) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },

  markAllRead: async () => {
    const res = await api.put('/notifications/read-all');
    return res.data;
  },
};

// ─── Favorites Service ────────────────────────────────────────────────────────
export const favoritesService = {
  getRestaurants: async () => {
    const res = await api.get<ApiResponse<RestaurantSummary[]>>('/favorites/restaurants');
    return res.data;
  },

  addRestaurant: async (id: string) => {
    const res = await api.post(`/favorites/restaurants/${id}`);
    return res.data;
  },

  removeRestaurant: async (id: string) => {
    const res = await api.delete(`/favorites/restaurants/${id}`);
    return res.data;
  },
};

// ─── Admin Service ────────────────────────────────────────────────────────────
export const adminService = {
  getDashboard: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  getRestaurants: async (page = 1, search?: string) => {
    const res = await api.get('/admin/restaurants', { params: { page, search } });
    return res.data;
  },

  getPendingRestaurants: async () => {
    const res = await api.get('/admin/restaurants/pending');
    return res.data;
  },

  approveRestaurant: async (id: string) => {
    const res = await api.put(`/admin/restaurants/${id}/approve`);
    return res.data;
  },

  rejectRestaurant: async (id: string, reason: string) => {
    const res = await api.put(`/admin/restaurants/${id}/reject`, { reason });
    return res.data;
  },

  getCustomers: async () => {
    const res = await api.get('/admin/users/customers');
    return res.data;
  },

  getDrivers: async () => {
    const res = await api.get('/admin/users/drivers');
    return res.data;
  },

  suspendUser: async (id: string) => {
    const res = await api.put(`/admin/users/${id}/suspend`);
    return res.data;
  },
};
