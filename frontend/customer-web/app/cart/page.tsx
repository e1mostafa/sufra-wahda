'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { orderService } from '@/services';
import { cn, formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    items, subtotal, total, deliveryFee: restaurantDeliveryFee,
    couponCode, couponDiscount, restaurantId, restaurantName,
    updateQuantity, removeItem, applyCoupon, removeCoupon
  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const handleValidateCoupon = async () => {
    if (!couponInput.trim()) return;
    if (!restaurantId) { toast.error('السلة فارغة'); return; }

    setValidatingCoupon(true);
    try {
      const res = await orderService.validateCoupon(
        couponInput.trim(), restaurantId, subtotal
      );
      if (res.data?.isValid) {
        applyCoupon(couponInput.trim(), res.data.discountAmount);
        toast.success(`🎉 تم تطبيق الكوبون! وفّرت ${formatPrice(res.data.discountAmount)}`);
        setCouponInput('');
      } else {
        toast.error(res.data?.error ?? 'الكوبون غير صحيح');
      }
    } catch {
      toast.error('حدث خطأ في التحقق من الكوبون');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <>
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
          <div className="text-8xl mb-6">🛒</div>
          <h2 className="font-tajawal font-black text-2xl text-gray-800 mb-2">السلة فارغة</h2>
          <p className="text-gray-400 mb-8 max-w-xs">
            لم تضف أي منتجات بعد. اكتشف مطاعمنا واطلب أكلك المفضل!
          </p>
          <Link href="/" className="btn-primary px-8 py-3">
            تصفح المطاعم 🍽️
          </Link>
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 pb-28 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <ShoppingBag className="w-6 h-6 text-burgundy" />
          <h1 className="font-tajawal font-black text-2xl text-gray-800">
            سلتي ({items.length} منتج)
          </h1>
        </div>

        {/* Restaurant info */}
        <div className="card p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-burgundy flex items-center justify-center text-xl">
            🏪
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{restaurantName}</p>
            <p className="text-xs text-gray-400">
              {items.reduce((s, i) => s + i.quantity, 0)} منتج في السلة
            </p>
          </div>
          <Link href={`/restaurants/${restaurantId}`} className="mr-auto text-xs text-burgundy font-semibold">
            إضافة المزيد +
          </Link>
        </div>

        {/* Cart Items */}
        <div className="space-y-3 mb-4">
          {items.map((item, idx) => (
            <div key={`${item.product.id}-${idx}`} className="card p-4">
              <div className="flex gap-3">
                {item.product.imageUrl ? (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.nameAr}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">
                    🍽️
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 text-sm leading-tight">
                    {item.product.nameAr}
                  </h4>
                  {item.notes && (
                    <p className="text-xs text-gray-400 mt-0.5 italic">📝 {item.notes}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-burgundy text-white shadow-sm flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-black text-burgundy text-sm">
                      {formatPrice(item.totalPrice)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    removeItem(item.product.id);
                    toast.success('تم الحذف من السلة');
                  }}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors shrink-0 self-start"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Coupon */}
        <div className="card p-4 mb-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-burgundy" />
            كوبون الخصم
          </h3>
          {couponCode ? (
            <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3">
              <div>
                <p className="font-bold text-green-700 text-sm">{couponCode}</p>
                <p className="text-xs text-green-600">وفّرت {formatPrice(couponDiscount)}</p>
              </div>
              <button
                onClick={() => { removeCoupon(); toast.success('تم إزالة الكوبون'); }}
                className="text-red-400 hover:text-red-600 text-xs font-semibold"
              >
                إزالة
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
                placeholder="أدخل كود الخصم"
                className="input-field flex-1 text-sm py-2.5"
                maxLength={20}
              />
              <button
                onClick={handleValidateCoupon}
                disabled={validatingCoupon || !couponInput.trim()}
                className="btn-primary px-4 py-2.5 text-sm"
              >
                {validatingCoupon ? '...' : 'تطبيق'}
              </button>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="card p-5 mb-4">
          <h3 className="font-bold text-gray-800 mb-4">ملخص الطلب</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>المجموع الجزئي</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>رسوم التوصيل</span>
              <span className={cn('font-semibold', restaurantDeliveryFee === 0 && 'text-green-600')}>
                {restaurantDeliveryFee === 0 ? 'مجاني' : formatPrice(restaurantDeliveryFee)}
              </span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>خصم الكوبون</span>
                <span className="font-semibold">- {formatPrice(couponDiscount)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 flex justify-between text-lg font-black">
              <span className="text-gray-800">الإجمالي</span>
              <span className="text-burgundy">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          className="btn-primary w-full py-4 text-lg flex items-center justify-between px-6"
        >
          <span>المتابعة للدفع</span>
          <span className="font-black">{formatPrice(total)}</span>
        </button>

        <p className="text-center text-xs text-gray-400 mt-3">
          بالمتابعة أنت توافق على الشروط والأحكام
        </p>
      </main>
      <BottomNav />
    </>
  );
}
