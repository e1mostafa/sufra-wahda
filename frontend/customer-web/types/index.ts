// ─── API Response Types ───────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors: string[];
  pagination?: Pagination;
  timestamp?: number;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ─── Auth Types ───────────────────────────────────────────────────────────────
export type UserRole = 'Customer' | 'RestaurantOwner' | 'Driver' | 'Admin' | 'SuperAdmin';
export type UserStatus = 'PendingVerification' | 'Active' | 'Inactive' | 'Suspended';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  profileImageUrl?: string;
  role: UserRole;
  loyaltyPoints: number;
  referralCode?: string;
  isPhoneVerified: boolean;
  lastLoginAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

// ─── Restaurant Types ─────────────────────────────────────────────────────────
export type RestaurantStatus = 'PendingApproval' | 'Active' | 'Inactive' | 'Suspended';

export interface RestaurantSummary {
  id: string;
  nameAr: string;
  nameEn?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  categoryName?: string;
  averageRating: number;
  totalRatings: number;
  deliveryFee: number;
  estimatedDeliveryMinutes: number;
  isOpen: boolean;
  isFeatured: boolean;
  isSponsored: boolean;
  minOrderAmount: number;
  tags?: string[];
  isFavorite?: boolean;
}

export interface RestaurantDetail extends RestaurantSummary {
  descriptionAr?: string;
  phone: string;
  address: string;
  city: string;
  totalOrders: number;
  maxDeliveryRadiusKm: number;
  openingHoursJson?: string;
  menu: MenuCategory[];
  images: RestaurantImage[];
}

export interface RestaurantImage {
  id: string;
  imageUrl: string;
  displayOrder: number;
}

// ─── Menu Types ───────────────────────────────────────────────────────────────
export interface MenuCategory {
  id: string;
  nameAr: string;
  nameEn?: string;
  imageUrl?: string;
  displayOrder: number;
  products: Product[];
}

export interface Product {
  id: string;
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  imageUrl?: string;
  basePrice: number;
  discountedPrice?: number;
  effectivePrice: number;
  calories?: number;
  isAvailable: boolean;
  isFeatured: boolean;
  preparationMinutes: number;
  tags?: string[];
  averageRating: number;
  options: ProductOption[];
}

export interface ProductOption {
  id: string;
  nameAr: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  values: ProductOptionValue[];
}

export interface ProductOptionValue {
  id: string;
  nameAr: string;
  additionalPrice: number;
  isDefault: boolean;
}

// ─── Cart Types ───────────────────────────────────────────────────────────────
export interface CartItem {
  product: Product;
  quantity: number;
  selectedOptions: SelectedOption[];
  notes?: string;
  totalPrice: number;
}

export interface SelectedOption {
  optionId: string;
  valueIds: string[];
}

export interface Cart {
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode?: string;
}

// ─── Order Types ──────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'Pending' | 'Confirmed' | 'Preparing' | 'ReadyForPickup'
  | 'PickedUp' | 'OnTheWay' | 'Delivered' | 'Cancelled' | 'Refunded';

export type PaymentMethod =
  | 'Cash' | 'Visa' | 'Mastercard' | 'Fawry'
  | 'VodafoneCash' | 'EtisalatCash' | 'OrangeMoney';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export const ORDER_STATUS_AR: Record<OrderStatus, string> = {
  Pending: 'في الانتظار',
  Confirmed: 'تم التأكيد',
  Preparing: 'يُحضَّر',
  ReadyForPickup: 'جاهز للاستلام',
  PickedUp: 'تم الاستلام',
  OnTheWay: 'في الطريق إليك',
  Delivered: 'تم التسليم',
  Cancelled: 'ملغي',
  Refunded: 'مسترجع',
};

export const PAYMENT_METHOD_AR: Record<PaymentMethod, string> = {
  Cash: 'كاش عند الاستلام',
  Visa: 'فيزا',
  Mastercard: 'ماستركارد',
  Fawry: 'فوري',
  VodafoneCash: 'فودافون كاش',
  EtisalatCash: 'اتصالات كاش',
  OrangeMoney: 'أورانج موني',
};

export interface OrderSummary {
  id: string;
  orderNumber: string;
  restaurant: RestaurantSummary;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  deliveryFee: number;
  discountAmount: number;
  deliveryAddress: string;
  createdAt: string;
  estimatedDeliveryAt?: string;
  itemCount: number;
}

export interface OrderDetail extends OrderSummary {
  subtotal: number;
  taxAmount: number;
  customerNotes?: string;
  deliveryNotes?: string;
  deliveredAt?: string;
  items: OrderItem[];
  statusHistory: StatusHistoryItem[];
  driver?: DriverTracking;
}

export interface OrderItem {
  productId: string;
  productNameAr: string;
  productImageUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface StatusHistoryItem {
  status: OrderStatus;
  statusAr: string;
  createdAt: string;
}

export interface DriverTracking {
  driverId: string;
  driverName: string;
  driverPhone?: string;
  currentLatitude?: number;
  currentLongitude?: number;
}

// ─── Address Types ────────────────────────────────────────────────────────────
export interface Address {
  id: string;
  label?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

// ─── Notification Types ───────────────────────────────────────────────────────
export interface Notification {
  id: string;
  titleAr: string;
  bodyAr: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Review Types ─────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  customerName: string;
  customerImageUrl?: string;
  foodRating: number;
  deliveryRating?: number;
  overallRating: number;
  comment?: string;
  restaurantReply?: string;
  createdAt: string;
}

// ─── Coupon Types ─────────────────────────────────────────────────────────────
export interface CouponValidation {
  isValid: boolean;
  error?: string;
  discountAmount: number;
  type?: string;
  value?: number;
}
