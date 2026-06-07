'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, MapPin, Clock, Phone, Package, Star, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { orderService } from '@/services';
import { ORDER_STATUS_AR, PAYMENT_METHOD_AR, OrderStatus } from '@/types';
import { cn, formatDate, formatPrice, getOrderStatusColor, getOrderStatusIcon } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useState } from 'react';

const STATUS_STEPS: OrderStatus[] = [
  'Pending', 'Confirmed', 'Preparing', 'ReadyForPickup', 'OnTheWay', 'Delivered'
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getById(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const order = query.state.data?.data;
      const activeStatuses: OrderStatus[] = ['Pending', 'Confirmed', 'Preparing', 'ReadyForPickup', 'OnTheWay'];
      return order && activeStatuses.includes(order.status) ? 15000 : false;
    },
  });

  const order = data?.data;

  const handleCancel = async () => {
    if (!window.confirm('هل أنت متأكد من إلغاء الطلب؟')) return;
    setCancelling(true);
    try {
      const res = await orderService.cancelOrder(id);
      if (res.success) { toast.success('تم إلغاء الطلب'); refetch(); }
      else toast.error(res.errors?.[0] ?? 'لا يمكن إلغاء الطلب الآن');
    } catch { toast.error('حدث خطأ'); } finally { setCancelling(false); }
  };

  if (isLoading) {
    return (<>
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
    </>);
  }

  if (!order) {
    return (<>
      <Header />
      <div className="text-center py-20">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-gray-600 font-semibold">الطلب غير موجود</p>
        <Link href="/orders" className="btn-primary mt-4 inline-block">طلباتي</Link>
      </div>
    </>);
  }

  const currentStepIdx = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'Cancelled' || order.status === 'Refunded';
  const canCancel = order.status === 'Pending' || order.status === 'Confirmed';

  return (<>
    <Header />
    <main className="max-w-2xl mx-auto px-4 pb-24 pt-4">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-tajawal font-black text-xl">تفاصيل الطلب</h1>
          <p className="text-xs text-gray-400">#{order.orderNumber}</p>
        </div>
        <span className={cn('badge mr-auto', getOrderStatusColor(order.status))}>
          {getOrderStatusIcon(order.status)} {ORDER_STATUS_AR[order.status]}
        </span>
      </div>

      {/* Status Progress (only for non-cancelled) */}
      {!isCancelled && (
        <div className="card p-5 mb-4">
          <h3 className="font-bold text-gray-800 text-sm mb-4">حالة طلبك</h3>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 right-0 left-0 h-0.5 bg-gray-100 z-0" />
            <div
              className="absolute top-4 right-0 h-0.5 bg-burgundy z-0 transition-all duration-700"
              style={{ width: currentStepIdx >= 0 ? `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%` : '0%' }}
            />
            {STATUS_STEPS.map((status, i) => {
              const done = i <= currentStepIdx;
              const current = i === currentStepIdx;
              return (
                <div key={status} className="flex flex-col items-center gap-1.5 z-10">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                    done ? 'bg-burgundy border-burgundy' : 'bg-white border-gray-200',
                    current && 'ring-4 ring-burgundy/20'
                  )}>
                    {done ? <CheckCircle2 className="w-4 h-4 text-white" /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                  </div>
                  <span className={cn('text-[9px] font-semibold text-center leading-tight max-w-[50px]',
                    done ? 'text-burgundy' : 'text-gray-400')}>
                    {ORDER_STATUS_AR[status]}
                  </span>
                </div>
              );
            })}
          </div>

          {order.estimatedDeliveryAt && order.status !== 'Delivered' && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
              <Clock className="w-4 h-4 text-burgundy shrink-0" />
              <span>
                الوقت المتوقع: <strong className="text-gray-800">{formatDate(order.estimatedDeliveryAt)}</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Restaurant & Driver */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl gradient-burgundy flex items-center justify-center text-xl">🏪</div>
          <div className="flex-1">
            <p className="font-bold text-gray-800 text-sm">{order.restaurant.nameAr}</p>
            <p className="text-xs text-gray-400">المطعم</p>
          </div>
        </div>
        {order.driver && (
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <div className="w-10 h-10 rounded-full gradient-burgundy flex items-center justify-center text-xl">🛵</div>
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-sm">{order.driver.driverName}</p>
              <p className="text-xs text-gray-400">سائق التوصيل</p>
            </div>
            {order.driver.driverPhone && (
              <a href={`tel:${order.driver.driverPhone}`} className="p-2 bg-burgundy/10 rounded-xl">
                <Phone className="w-4 h-4 text-burgundy" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Delivery Address */}
      <div className="card p-4 mb-4 flex items-start gap-3">
        <MapPin className="w-5 h-5 text-burgundy shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-gray-800 text-sm">عنوان التوصيل</p>
          <p className="text-gray-500 text-xs mt-0.5">{order.deliveryAddress}</p>
          {order.deliveryNotes && <p className="text-xs text-gray-400 mt-1 italic">📝 {order.deliveryNotes}</p>}
        </div>
      </div>

      {/* Order Items */}
      <div className="card p-5 mb-4">
        <h3 className="font-bold text-gray-800 mb-3">المنتجات</h3>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0">🍽️</div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">{item.productNameAr}</p>
                <p className="text-xs text-gray-400">× {item.quantity}</p>
              </div>
              <p className="font-bold text-sm text-burgundy">{formatPrice(item.totalPrice)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Price Summary */}
      <div className="card p-5 mb-4">
        <h3 className="font-bold text-gray-800 mb-3">ملخص الدفع</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-500"><span>المجموع</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between text-gray-500"><span>التوصيل</span><span>{formatPrice(order.deliveryFee)}</span></div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-600"><span>الخصم</span><span>- {formatPrice(order.discountAmount)}</span></div>
          )}
          <div className="flex justify-between font-black text-base border-t border-gray-100 pt-2">
            <span className="text-gray-800">الإجمالي</span>
            <span className="text-burgundy">{formatPrice(order.totalAmount)}</span>
          </div>
          <div className="text-xs text-gray-400">{PAYMENT_METHOD_AR[order.paymentMethod]}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {canCancel && (
          <button onClick={handleCancel} disabled={cancelling}
            className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors disabled:opacity-50">
            {cancelling ? 'جاري الإلغاء...' : 'إلغاء الطلب'}
          </button>
        )}
        {order.status === 'Delivered' && (
          <Link href={`/orders/${id}/review`} className="flex-1 btn-primary py-3 text-sm text-center">
            <Star className="w-4 h-4 inline ml-2" /> قيّم التجربة
          </Link>
        )}
        <Link href="/" className="flex-1 btn-secondary py-3 text-sm text-center">
          طلب جديد 🍽️
        </Link>
      </div>
    </main>
    <BottomNav />
  </>);
}
