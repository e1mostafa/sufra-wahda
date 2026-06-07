'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronLeft, Clock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { orderService } from '@/services';
import { OrderSummary, ORDER_STATUS_AR } from '@/types';
import { cn, formatPrice, formatRelativeTime, getOrderStatusColor, getOrderStatusIcon } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login?redirect=/orders');
  }, [isAuthenticated]);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: () => orderService.getMyOrders(1, 20),
    enabled: isAuthenticated,
  });

  const orders = data?.data ?? [];

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 pb-28 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-burgundy" />
          <h1 className="font-tajawal font-black text-2xl text-gray-800">طلباتي</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-4"><div className="skeleton h-24 rounded-xl" /></div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-7xl mb-4">📦</div>
            <p className="text-xl font-semibold text-gray-700 mb-2">لا توجد طلبات بعد</p>
            <p className="text-gray-400 text-sm mb-6">ابدأ بأول طلب من مطاعمنا المميزة</p>
            <Link href="/" className="btn-primary px-8 py-3">اطلب الآن 🍽️</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="card-hover block p-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">
                    {getOrderStatusIcon(order.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{order.restaurant.nameAr}</p>
                        <p className="text-xs text-gray-400 mt-0.5">#{order.orderNumber}</p>
                      </div>
                      <span className={cn('badge text-xs shrink-0', getOrderStatusColor(order.status))}>
                        {ORDER_STATUS_AR[order.status]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(order.createdAt)}
                      </span>
                      <span className="font-black text-burgundy text-sm">{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
