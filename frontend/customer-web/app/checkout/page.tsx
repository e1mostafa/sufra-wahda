'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, CreditCard, Wallet, Banknote, ArrowRight, Plus, Check } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { addressService, orderService } from '@/services';
import { Address, PaymentMethod, PAYMENT_METHOD_AR } from '@/types';
import { cn, formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

const PAYMENT_OPTIONS: { method: PaymentMethod; icon: string; label: string; desc: string }[] = [
  { method: 'Cash', icon: '💵', label: 'كاش عند الاستلام', desc: 'ادفع للسائق عند الوصول' },
  { method: 'Fawry', icon: '🏪', label: 'فوري', desc: 'ادفع في أي فرع فوري' },
  { method: 'VodafoneCash', icon: '📱', label: 'فودافون كاش', desc: 'ادفع من محفظتك' },
  { method: 'Visa', icon: '💳', label: 'فيزا / ماستركارد', desc: 'دفع آمن بالبطاقة' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { items, total, subtotal, deliveryFee: cartDeliveryFee, couponCode, couponDiscount,
    restaurantId, restaurantName, clearCart } = useCartStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [customAddress, setCustomAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login?redirect=/checkout'); return; }
    if (items.length === 0) { router.push('/'); return; }
    loadAddresses();
  }, [isAuthenticated]);

  const loadAddresses = async () => {
    try {
      const res = await addressService.getAll();
      const addrs = res.data ?? [];
      setAddresses(addrs);
      const def = addrs.find((a) => a.isDefault) ?? addrs[0];
      if (def) setSelectedAddress(def);
    } catch { /* silent */ } finally {
      setLoadingAddresses(false);
    }
  };

  const deliveryAddress = selectedAddress
    ? `${selectedAddress.addressLine1}${selectedAddress.landmark ? ' - ' + selectedAddress.landmark : ''}, ${selectedAddress.city}`
    : customAddress;

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) { toast.error('يرجى إدخال عنوان التوصيل'); return; }
    if (!restaurantId) { toast.error('السلة فارغة'); return; }

    setLoading(true);
    try {
      const res = await orderService.placeOrder({
        restaurantId,
        deliveryAddress: deliveryAddress.trim(),
        deliveryLatitude: selectedAddress?.latitude,
        deliveryLongitude: selectedAddress?.longitude,
        paymentMethod,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          selectedOptions: i.selectedOptions,
          notes: i.notes,
        })),
        couponCode: couponCode ?? undefined,
        customerNotes: notes || undefined,
      });

      if (res.success && res.data) {
        clearCart();
        toast.success('تم إرسال طلبك بنجاح! 🎉');
        router.push(`/orders/${res.data.id}`);
      } else {
        toast.error(res.errors?.[0] ?? 'حدث خطأ في إرسال الطلب');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.errors?.[0] ?? 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 pb-8 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1 className="font-tajawal font-black text-2xl">إتمام الطلب</h1>
        </div>

        {/* Delivery Address */}
        <div className="card p-5 mb-4">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-burgundy" /> عنوان التوصيل
          </h2>

          {loadingAddresses ? (
            <div className="skeleton h-16 rounded-xl" />
          ) : addresses.length > 0 ? (
            <div className="space-y-3 mb-4">
              {addresses.map((addr) => (
                <button key={addr.id} onClick={() => setSelectedAddress(addr)}
                  className={cn('w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-right',
                    selectedAddress?.id === addr.id ? 'border-burgundy bg-burgundy/5' : 'border-gray-100 hover:border-gray-200')}>
                  <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                    selectedAddress?.id === addr.id ? 'border-burgundy bg-burgundy' : 'border-gray-300')}>
                    {selectedAddress?.id === addr.id && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800">
                      {addr.label ?? 'عنوان'} {addr.isDefault && <span className="text-xs text-burgundy">(افتراضي)</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{addr.addressLine1}, {addr.city}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          {/* Manual address input */}
          {(!selectedAddress && addresses.length === 0) || (!selectedAddress) ? (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">أدخل العنوان يدوياً</label>
              <textarea value={customAddress} onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="مثال: شارع كورنيش النيل، أمام مسجد الفتح، المنيا"
                className="input-field resize-none text-sm" rows={3} />
            </div>
          ) : null}

          <Link href="/profile/addresses" className="flex items-center gap-2 text-sm text-burgundy font-semibold mt-3">
            <Plus className="w-4 h-4" /> إضافة عنوان جديد
          </Link>
        </div>

        {/* Payment Method */}
        <div className="card p-5 mb-4">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-burgundy" /> طريقة الدفع
          </h2>
          <div className="space-y-3">
            {PAYMENT_OPTIONS.map(({ method, icon, label, desc }) => (
              <button key={method} onClick={() => setPaymentMethod(method)}
                className={cn('w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-right',
                  paymentMethod === method ? 'border-burgundy bg-burgundy/5' : 'border-gray-100 hover:border-gray-200')}>
                <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                  paymentMethod === method ? 'border-burgundy bg-burgundy' : 'border-gray-300')}>
                  {paymentMethod === method && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-2xl shrink-0">{icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="card p-5 mb-4">
          <h2 className="font-bold text-gray-800 mb-3">ملاحظات إضافية</h2>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="أي ملاحظات للمطعم أو السائق..."
            className="input-field resize-none text-sm" rows={2} maxLength={300} />
        </div>

        {/* Order Summary */}
        <div className="card p-5 mb-6">
          <h2 className="font-bold text-gray-800 mb-4">ملخص الطلب</h2>
          <div className="space-y-2 text-sm">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-gray-600">
                <span>{item.product.nameAr} × {item.quantity}</span>
                <span className="font-semibold">{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-2 space-y-1.5">
              <div className="flex justify-between text-gray-500">
                <span>المجموع</span><span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>التوصيل</span>
                <span className={cartDeliveryFee === 0 ? 'text-green-600 font-semibold' : ''}>
                  {cartDeliveryFee === 0 ? 'مجاني' : formatPrice(cartDeliveryFee)}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>خصم ({couponCode})</span>
                  <span>- {formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-black pt-1 border-t border-gray-100">
                <span className="text-gray-800">الإجمالي</span>
                <span className="text-burgundy">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Place Order */}
        <button onClick={handlePlaceOrder} disabled={loading}
          className="btn-primary w-full py-4 text-lg flex items-center justify-between px-6">
          {loading ? (
            <span className="flex items-center gap-2 mx-auto">
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              جاري إرسال الطلب...
            </span>
          ) : (
            <>
              <span>تأكيد الطلب 🛵</span>
              <span className="font-black">{formatPrice(total)}</span>
            </>
          )}
        </button>
      </main>
    </>
  );
}
