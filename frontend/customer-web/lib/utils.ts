import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(0)} ج.م`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7) return `منذ ${days} يوم`;
  return formatDate(dateString);
}

export function normalizePhone(phone: string): string {
  phone = phone.trim().replace(/[\s-]/g, '');
  if (phone.startsWith('+20')) return '0' + phone.slice(3);
  if (phone.startsWith('0020')) return '0' + phone.slice(4);
  if (!phone.startsWith('0')) return '0' + phone;
  return phone;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('');
}

export function truncate(text: string, length = 60): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function calculateDeliveryFee(distanceKm: number, baseFee = 10, perKm = 2): number {
  return Math.ceil(baseFee + distanceKm * perKm);
}

export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 4.0) return 'text-amber-500';
  if (rating >= 3.0) return 'text-orange-500';
  return 'text-red-500';
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    Pending: 'bg-amber-50 text-amber-700',
    Confirmed: 'bg-blue-50 text-blue-700',
    Preparing: 'bg-purple-50 text-purple-700',
    ReadyForPickup: 'bg-indigo-50 text-indigo-700',
    PickedUp: 'bg-cyan-50 text-cyan-700',
    OnTheWay: 'bg-sky-50 text-sky-700',
    Delivered: 'bg-green-50 text-green-700',
    Cancelled: 'bg-red-50 text-red-700',
    Refunded: 'bg-gray-50 text-gray-700',
  };
  return colors[status] ?? 'bg-gray-50 text-gray-600';
}

export function getOrderStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    Pending: '⏳',
    Confirmed: '✅',
    Preparing: '🍳',
    ReadyForPickup: '📦',
    PickedUp: '🛵',
    OnTheWay: '🚀',
    Delivered: '🎉',
    Cancelled: '❌',
    Refunded: '💰',
  };
  return icons[status] ?? '📋';
}

export function isRestaurantOpen(openingHoursJson?: string): boolean {
  if (!openingHoursJson) return true; // assume open if no hours set
  try {
    const hours = JSON.parse(openingHoursJson) as Record<string, { open: string; close: string }>;
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = dayNames[now.getDay()];
    const todayHours = hours[today];
    if (!todayHours) return false;
    const [openH, openM] = todayHours.open.split(':').map(Number);
    const [closeH, closeM] = todayHours.close.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  } catch {
    return true;
  }
}
