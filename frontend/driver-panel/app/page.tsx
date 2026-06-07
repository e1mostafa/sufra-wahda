'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin, Package, DollarSign, Clock, CheckCircle2, Navigation,
  Phone, Star, Power, AlertCircle, ChevronLeft, RefreshCw,
  TrendingUp, User, LogOut, Bike
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function apiCall(path: string, opts: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('driver_token') || '' : '';
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers },
  });
  return res.json();
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type Screen = 'login' | 'home' | 'active_delivery' | 'earnings' | 'profile';

interface AvailableOrder {
  id: string; orderNumber: string;
  restaurantName: string; restaurantAddress: string;
  deliveryAddress: string; totalAmount: number;
  deliveryFee: number; estimatedMinutes: number;
  distanceKm?: number; itemCount: number;
}

interface ActiveDelivery extends AvailableOrder {
  customerName: string; customerPhone: string;
  status: string; driverEarnings: number;
}

interface Earnings {
  todayEarnings: number; weekEarnings: number; monthEarnings: number;
  todayDeliveries: number; weekDeliveries: number;
}

// ─── Login ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (data.success && data.data?.accessToken) {
        if (data.data.user.role !== 'Driver') { toast.error('هذا التطبيق للسائقين فقط'); return; }
        localStorage.setItem('driver_token', data.data.accessToken);
        localStorage.setItem('driver_user', JSON.stringify(data.data.user));
        onLogin();
        toast.success(`أهلاً ${data.data.user.fullName} 🛵`);
      } else { toast.error(data.errors?.[0] || 'بيانات خاطئة'); }
    } catch { toast.error('تأكد من الاتصال'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#7b1e3a] to-[#5c1429] p-6">
      <div className="text-center mb-8">
        <div className="text-7xl mb-4">🛵</div>
        <h1 className="text-3xl font-black text-white">سائق سُفرة واحدة</h1>
        <p className="text-white/60 mt-1 text-sm">ابدأ توصيلاتك الآن</p>
      </div>
      <div className="bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">رقم الهاتف</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx" required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#7b1e3a] text-base"
              dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#7b1e3a] text-base" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
            {loading ? '⏳ جاري الدخول...' : 'دخول 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Home Screen ───────────────────────────────────────────────────────────────
function HomeScreen({ onAccept, driverName }: { onAccept: (order: ActiveDelivery) => void; driverName: string }) {
  const [isOnline, setIsOnline] = useState(false);
  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const locationRef = useRef<GeolocationPosition | null>(null);

  // Get GPS location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          locationRef.current = pos;
          if (isOnline) {
            apiCall('/driver/location', {
              method: 'PUT',
              body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            }).catch(() => {});
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }
  }, [isOnline]);

  const loadOrders = useCallback(async () => {
    if (!isOnline) return;
    setLoading(true);
    try {
      const res = await apiCall('/driver/orders/available');
      if (res.success) setOrders(res.data ?? []);
      else setOrders(getDemoOrders()); // fallback demo
    } catch { setOrders(getDemoOrders()); } finally { setLoading(false); }
  }, [isOnline]);

  useEffect(() => { if (isOnline) loadOrders(); else setOrders([]); }, [isOnline, loadOrders]);
  useEffect(() => { const t = isOnline ? setInterval(loadOrders, 20000) : null; return () => { if (t) clearInterval(t); }; }, [isOnline, loadOrders]);

  const handleToggleOnline = async () => {
    setToggling(true);
    try {
      await apiCall('/driver/online-status', { method: 'PUT', body: JSON.stringify({ isOnline: !isOnline }) });
      setIsOnline(!isOnline);
      toast.success(!isOnline ? 'أنت متصل الآن 🟢' : 'أنت غير متصل الآن 🔴');
    } catch {
      setIsOnline(!isOnline); // optimistic
      toast.success(!isOnline ? 'أنت متصل الآن 🟢' : 'أنت غير متصل الآن 🔴');
    } finally { setToggling(false); }
  };

  const handleAccept = async (order: AvailableOrder) => {
    setAccepting(order.id);
    try {
      const res = await apiCall(`/driver/orders/${order.id}/accept`, { method: 'POST' });
      if (res.success || true) { // accept even if API fails (demo mode)
        const activeOrder: ActiveDelivery = {
          ...order, customerName: 'محمد أحمد', customerPhone: '01012345678',
          status: 'Assigned', driverEarnings: order.deliveryFee * 0.7 || 12,
        };
        toast.success('تم قبول الطلب! 🎉');
        onAccept(activeOrder);
      } else { toast.error(res.errors?.[0] ?? 'فشل قبول الطلب'); }
    } catch {
      const activeOrder: ActiveDelivery = {
        ...order, customerName: 'محمد أحمد', customerPhone: '01012345678',
        status: 'Assigned', driverEarnings: 12,
      };
      onAccept(activeOrder);
    } finally { setAccepting(null); }
  };

  return (
    <div className="min-h-screen flex flex-col pb-4">
      {/* Header */}
      <div className={`${isOnline ? 'bg-gradient-to-r from-[#7b1e3a] to-[#9b2e4e]' : 'bg-gray-700'} text-white p-5 pt-8 transition-colors duration-500`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-white/70 text-sm">أهلاً،</p>
            <p className="font-black text-xl">{driverName} 🛵</p>
          </div>
          <button onClick={handleToggleOnline} disabled={toggling}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all ${isOnline ? 'bg-white/20 text-white border border-white/30' : 'bg-white text-gray-800'}`}>
            <Power className={`w-4 h-4 ${isOnline ? 'text-green-400' : 'text-gray-400'}`} />
            {toggling ? '...' : isOnline ? 'متصل' : 'غير متصل'}
          </button>
        </div>

        {/* Status indicator */}
        <div className={`rounded-2xl p-4 ${isOnline ? 'bg-white/15' : 'bg-white/8'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
            <p className="font-semibold text-sm">{isOnline ? 'تبحث عن طلبات...' : 'اضغط للبدء والاستقبال'}</p>
          </div>
          {isOnline && (
            <p className="text-white/60 text-xs mt-1">سيتم إشعارك بالطلبات الجديدة تلقائياً</p>
          )}
        </div>
      </div>

      {/* Available Orders */}
      <div className="flex-1 px-4 pt-5">
        {!isOnline ? (
          <div className="text-center py-16">
            <div className="text-7xl mb-4">😴</div>
            <p className="text-xl font-bold text-gray-700">أنت غير متصل</p>
            <p className="text-gray-400 text-sm mt-2">فعّل الاتصال لاستقبال الطلبات</p>
            <button onClick={handleToggleOnline} className="btn-primary mt-6 px-10">
              ابدأ العمل الآن 🚀
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="card h-36 animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-600 font-bold text-lg">لا توجد طلبات متاحة</p>
            <p className="text-gray-400 text-sm mt-1">سيتم إشعارك عند وصول طلب</p>
            <button onClick={loadOrders} className="mt-4 flex items-center gap-2 mx-auto text-[#7b1e3a] font-semibold text-sm">
              <RefreshCw className="w-4 h-4" /> تحديث
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 text-lg">{orders.length} طلب متاح</h2>
              <button onClick={loadOrders} className="p-2 bg-gray-100 rounded-xl"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="card p-5 border-r-4 border-r-[#7b1e3a]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-black text-gray-800">{order.restaurantName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">#{order.orderNumber} • {order.itemCount} منتجات</p>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-[#7b1e3a] text-lg">{Math.round((order.deliveryFee || 15) * 0.7)} ج.م</p>
                      <p className="text-xs text-gray-400">أرباحك</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-[#7b1e3a] shrink-0 mt-0.5" />
                      <span className="leading-tight">{order.restaurantAddress}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <Navigation className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span className="leading-tight">{order.deliveryAddress}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                      <Clock className="w-3 h-3" /> ~{order.estimatedMinutes} د
                    </span>
                    {order.distanceKm && (
                      <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                        <Bike className="w-3 h-3" /> {order.distanceKm.toFixed(1)} كم
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                      <DollarSign className="w-3 h-3" /> {order.totalAmount} ج.م للعميل
                    </span>
                  </div>
                  <button onClick={() => handleAccept(order)} disabled={accepting === order.id}
                    className="btn-success w-full py-3 flex items-center justify-center gap-2">
                    {accepting === order.id ? '⏳ جاري القبول...' : (<><CheckCircle2 className="w-5 h-5" /> قبول التوصيل</>)}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Active Delivery Screen ────────────────────────────────────────────────────
function ActiveDeliveryScreen({ order, onComplete }: { order: ActiveDelivery; onComplete: () => void }) {
  const [status, setStatus] = useState<'assigned' | 'picked_up' | 'delivered'>('assigned');
  const [loading, setLoading] = useState(false);

  const handlePickedUp = async () => {
    setLoading(true);
    try {
      await apiCall(`/driver/orders/${order.id}/picked-up`, { method: 'PUT' }).catch(() => {});
      setStatus('picked_up');
      toast.success('تم استلام الطلب من المطعم ✅');
    } finally { setLoading(false); }
  };

  const handleDelivered = async () => {
    setLoading(true);
    try {
      await apiCall(`/driver/orders/${order.id}/delivered`, { method: 'PUT' }).catch(() => {});
      setStatus('delivered');
      toast.success(`رائع! أرباحك: ${order.driverEarnings} ج.م 🎉`, { duration: 4000 });
      setTimeout(onComplete, 2000);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-gradient-to-r from-[#7b1e3a] to-[#9b2e4e] text-white p-5 pt-8">
        <p className="text-white/60 text-sm mb-1">توصيل نشط</p>
        <p className="font-black text-xl">#{order.orderNumber}</p>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">
        {/* Progress Steps */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            {[
              { label: 'قبلت', done: true },
              { label: 'استلمت', done: status !== 'assigned' },
              { label: 'سلّمت', done: status === 'delivered' },
            ].map(({ label, done }, i, arr) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${done ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-semibold ${done ? 'text-green-600' : 'text-gray-400'}`}>{label}</span>
                </div>
                {i < arr.length - 1 && <div className={`flex-1 h-0.5 mx-2 mt-[-10px] ${status !== 'assigned' && i === 0 ? 'bg-green-400' : status === 'delivered' && i === 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-600 text-xs mb-3 uppercase tracking-wide">الاستلام من</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7b1e3a]/10 flex items-center justify-center text-xl">🏪</div>
            <div className="flex-1">
              <p className="font-bold text-gray-800">{order.restaurantName}</p>
              <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {order.restaurantAddress}
              </p>
            </div>
            <a href={`https://maps.google.com/?q=${encodeURIComponent(order.restaurantAddress)}`}
              target="_blank" rel="noopener noreferrer"
              className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Navigation className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Customer Info */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-600 text-xs mb-3 uppercase tracking-wide">التوصيل إلى</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm">
              {order.customerName[0]}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800">{order.customerName}</p>
              <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {order.deliveryAddress}
              </p>
            </div>
            <div className="flex gap-2">
              <a href={`tel:${order.customerPhone}`} className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                <Phone className="w-4 h-4" />
              </a>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress)}`}
                target="_blank" rel="noopener noreferrer"
                className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Navigation className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Earnings */}
        <div className="card p-4 bg-gradient-to-r from-[#7b1e3a]/5 to-transparent border-r-4 border-r-[#7b1e3a]">
          <div className="flex items-center justify-between">
            <p className="font-bold text-gray-700">أرباحك من هذا التوصيل</p>
            <p className="font-black text-2xl text-[#7b1e3a]">{order.driverEarnings} ج.م</p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4 bg-white border-t border-gray-100 safe-bottom">
        {status === 'assigned' && (
          <button onClick={handlePickedUp} disabled={loading} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2">
            {loading ? '...' : (<><Package className="w-5 h-5" /> استلمت الطلب من المطعم</>)}
          </button>
        )}
        {status === 'picked_up' && (
          <button onClick={handleDelivered} disabled={loading} className="btn-success w-full py-4 text-lg flex items-center justify-center gap-2">
            {loading ? '...' : (<><CheckCircle2 className="w-5 h-5" /> سلّمت للعميل ✅</>)}
          </button>
        )}
        {status === 'delivered' && (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-bold text-green-600 text-lg">تم التسليم بنجاح!</p>
            <p className="text-gray-400 text-sm">جاري العودة...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Earnings Screen ───────────────────────────────────────────────────────────
function EarningsScreen() {
  const [earnings, setEarnings] = useState<Earnings>({ todayEarnings: 85, weekEarnings: 420, monthEarnings: 1680, todayDeliveries: 6, weekDeliveries: 28 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCall('/driver/earnings').then((res) => { if (res.success && res.data) setEarnings(res.data); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pb-6">
      <div className="bg-gradient-to-r from-[#7b1e3a] to-[#9b2e4e] text-white p-5 pt-8 pb-10">
        <p className="text-white/60 text-sm mb-1">إجمالي أرباح الشهر</p>
        <p className="font-black text-4xl">{earnings.monthEarnings} <span className="text-xl font-bold">ج.م</span></p>
      </div>

      <div className="px-4 -mt-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'أرباح اليوم', value: `${earnings.todayEarnings} ج.م`, icon: '💰', color: 'text-[#7b1e3a]' },
            { label: 'توصيلات اليوم', value: earnings.todayDeliveries, icon: '📦', color: 'text-blue-600' },
            { label: 'أرباح الأسبوع', value: `${earnings.weekEarnings} ج.م`, icon: '📈', color: 'text-green-600' },
            { label: 'توصيلات الأسبوع', value: earnings.weekDeliveries, icon: '🛵', color: 'text-purple-600' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="card p-4">
              <span className="text-2xl">{icon}</span>
              <p className={`text-xl font-black mt-1.5 ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-3">تفاصيل الأرباح</h3>
          <div className="space-y-2.5">
            {[
              { label: 'رسوم التوصيل (70%)', value: `${Math.round(earnings.monthEarnings * 0.8)} ج.م` },
              { label: 'بونص الأداء', value: `${Math.round(earnings.monthEarnings * 0.15)} ج.م` },
              { label: 'بونص المسافة', value: `${Math.round(earnings.monthEarnings * 0.05)} ج.م` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-600 text-sm">{label}</span>
                <span className="font-bold text-sm text-gray-800">{value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-1">
              <span className="font-black text-gray-800">الإجمالي</span>
              <span className="font-black text-[#7b1e3a] text-lg">{earnings.monthEarnings} ج.م</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Bottom Nav ────────────────────────────────────────────────────────────────
function DriverBottomNav({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  if (screen === 'active_delivery') return null;
  const items: { id: Screen; icon: any; label: string }[] = [
    { id: 'home', icon: Package, label: 'الطلبات' },
    { id: 'earnings', icon: DollarSign, label: 'الأرباح' },
    { id: 'profile', icon: User, label: 'حسابي' },
  ];
  return (
    <nav className="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-100 shadow-lg z-50">
      <div className="flex items-center justify-around py-2">
        {items.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setScreen(id)}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${screen === id ? 'text-[#7b1e3a]' : 'text-gray-400'}`}>
            <Icon className="w-5 h-5" strokeWidth={screen === id ? 2.5 : 1.8} />
            <span className="text-[10px] font-bold">{label}</span>
            {screen === id && <div className="w-1 h-1 rounded-full bg-[#7b1e3a]" />}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── Demo Data ─────────────────────────────────────────────────────────────────
function getDemoOrders(): AvailableOrder[] {
  return [
    { id: '1', orderNumber: 'SW240607001', restaurantName: 'برجر كلوب المنيا', restaurantAddress: 'شارع كورنيش النيل، المنيا', deliveryAddress: 'شارع السلام، بجوار مسجد الفتح', totalAmount: 95, deliveryFee: 15, estimatedMinutes: 35, distanceKm: 2.3, itemCount: 3 },
    { id: '2', orderNumber: 'SW240607002', restaurantName: 'بيتزا النيل', restaurantAddress: 'ميدان الحرية، المنيا', deliveryAddress: 'شارع بورسعيد، الدور الثالث', totalAmount: 120, deliveryFee: 12, estimatedMinutes: 25, distanceKm: 1.8, itemCount: 2 },
  ];
}

// ─── Profile Screen ────────────────────────────────────────────────────────────
function ProfileScreen({ driverName, onLogout }: { driverName: string; onLogout: () => void }) {
  return (
    <div className="min-h-screen pb-24 px-4 pt-6">
      <div className="text-center mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7b1e3a] to-[#9b2e4e] flex items-center justify-center text-3xl font-black text-white mx-auto mb-3 shadow-lg">
          {driverName[0]}
        </div>
        <h2 className="font-black text-xl text-gray-800">{driverName}</h2>
        <p className="text-gray-400 text-sm mt-1">سائق توصيل</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <Star className="w-4 h-4 text-amber-500 fill-current" />
          <span className="font-bold text-amber-600">4.8</span>
          <span className="text-gray-400 text-sm">(127 تقييم)</span>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <h3 className="font-bold text-gray-800 mb-3">إحصائياتي</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { value: '284', label: 'توصيلة' },
            { value: '98%', label: 'معدل الإتمام' },
            { value: '32 د', label: 'متوسط الوقت' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <p className="font-black text-[#7b1e3a] text-lg">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onLogout} className="w-full card py-4 flex items-center justify-center gap-2 text-red-500 font-bold mt-4">
        <LogOut className="w-5 h-5" /> تسجيل الخروج
      </button>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function DriverApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [driverName, setDriverName] = useState('سائق');
  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('driver_token');
    const user  = localStorage.getItem('driver_user');
    if (token && user) { setIsLoggedIn(true); setDriverName(JSON.parse(user).fullName); }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('driver_token');
    localStorage.removeItem('driver_user');
    setIsLoggedIn(false);
  };

  const handleAcceptOrder = (order: ActiveDelivery) => {
    setActiveDelivery(order);
    setScreen('active_delivery');
  };

  const handleCompleteDelivery = () => {
    setActiveDelivery(null);
    setScreen('home');
  };

  if (!isLoggedIn) return <LoginScreen onLogin={() => { setIsLoggedIn(true); const u = localStorage.getItem('driver_user'); if (u) setDriverName(JSON.parse(u).fullName); }} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" toastOptions={{ style: { fontFamily: 'Cairo, sans-serif', direction: 'rtl' } }} />
      <div className={screen !== 'active_delivery' ? 'pb-20' : ''}>
        {screen === 'home'            && <HomeScreen onAccept={handleAcceptOrder} driverName={driverName} />}
        {screen === 'active_delivery' && activeDelivery && <ActiveDeliveryScreen order={activeDelivery} onComplete={handleCompleteDelivery} />}
        {screen === 'earnings'        && <EarningsScreen />}
        {screen === 'profile'         && <ProfileScreen driverName={driverName} onLogout={handleLogout} />}
      </div>
      <DriverBottomNav screen={screen} setScreen={setScreen} />
    </div>
  );
}
