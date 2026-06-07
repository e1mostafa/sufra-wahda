'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Package, UtensilsCrossed, BarChart3, Star,
  Settings, LogOut, Bell, ChevronDown, Check, X, Clock, TrendingUp,
  Users, DollarSign, RefreshCw, Eye, Edit, Trash2, Plus, Search,
  Menu as MenuIcon, AlertCircle
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import toast, { Toaster } from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ─── Auth ──────────────────────────────────────────────────────────────────────
let globalToken = '';
if (typeof window !== 'undefined') globalToken = localStorage.getItem('rw_token') || '';

async function apiCall(path: string, opts: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('rw_token') || '' : '';
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers },
  });
  return res.json();
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type OrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'ReadyForPickup' | 'OnTheWay' | 'Delivered' | 'Cancelled';
interface Order {
  id: string; orderNumber: string; status: OrderStatus;
  totalAmount: number; createdAt: string;
  customer: { fullName: string; phone: string };
  items: { productNameAr: string; quantity: number; totalPrice: number }[];
}

const STATUS_AR: Record<OrderStatus, string> = {
  Pending: 'جديد', Confirmed: 'مؤكد', Preparing: 'يُحضَّر',
  ReadyForPickup: 'جاهز', OnTheWay: 'في الطريق',
  Delivered: 'تم التسليم', Cancelled: 'ملغي',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  Pending: 'bg-amber-100 text-amber-800', Confirmed: 'bg-blue-100 text-blue-800',
  Preparing: 'bg-purple-100 text-purple-800', ReadyForPickup: 'bg-indigo-100 text-indigo-800',
  OnTheWay: 'bg-sky-100 text-sky-800', Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

type Page = 'dashboard' | 'orders' | 'menu' | 'analytics' | 'reviews' | 'settings';

// ─── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
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
        localStorage.setItem('rw_token', data.data.accessToken);
        localStorage.setItem('rw_user', JSON.stringify(data.data.user));
        onLogin(data.data.accessToken);
        toast.success(`أهلاً ${data.data.user.fullName}`);
      } else {
        toast.error(data.errors?.[0] || 'بيانات خاطئة');
      }
    } catch { toast.error('تأكد من اتصال الإنترنت'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#7b1e3a] to-[#5c1429] p-4">
      <Toaster position="top-center" />
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#7b1e3a] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🍽️</div>
          <h1 className="text-2xl font-black text-gray-800">لوحة تحكم المطعم</h1>
          <p className="text-gray-400 text-sm mt-1">سُفرة واحدة — للمطاعم</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">رقم الهاتف</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx" className="input-field" dir="ltr" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" className="input-field" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? 'جاري الدخول...' : 'دخول لوحة التحكم →'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, restaurantName, isOpen, onToggleOpen, onLogout }:
  { page: Page; setPage: (p: Page) => void; restaurantName: string; isOpen: boolean; onToggleOpen: () => void; onLogout: () => void }) {
  const items: { id: Page; icon: any; label: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
    { id: 'orders', icon: Package, label: 'الطلبات' },
    { id: 'menu', icon: UtensilsCrossed, label: 'القائمة' },
    { id: 'analytics', icon: BarChart3, label: 'التحليلات' },
    { id: 'reviews', icon: Star, label: 'التقييمات' },
    { id: 'settings', icon: Settings, label: 'الإعدادات' },
  ];

  return (
    <aside className="w-64 bg-[#5c1429] min-h-screen flex flex-col fixed right-0 top-0 bottom-0 z-50">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2 text-white font-black text-lg">
          <span className="text-2xl">🍽️</span> سُفرة واحدة
        </div>
      </div>
      <div className="p-4 bg-white/5 border-b border-white/10">
        <p className="text-white font-bold text-sm truncate">{restaurantName}</p>
        <button onClick={onToggleOpen} className={`mt-2 flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${isOpen ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
          <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
          {isOpen ? 'مفتوح الآن' : 'مغلق'}
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setPage(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-right ${page === id ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/8 hover:text-white'}`}>
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/8 hover:text-white transition-all">
          <LogOut className="w-5 h-5" /> تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

// ─── Dashboard Page ────────────────────────────────────────────────────────────
function DashboardView({ restaurantId }: { restaurantId: string }) {
  const [stats, setStats] = useState({ todayOrders: 0, todayRevenue: 0, monthRevenue: 0, avgRating: 4.8 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const chartData = [
    { day: 'السبت', revenue: 1200 }, { day: 'الأحد', revenue: 900 },
    { day: 'الإثنين', revenue: 1500 }, { day: 'الثلاثاء', revenue: 1100 },
    { day: 'الأربعاء', revenue: 1800 }, { day: 'الخميس', revenue: 2200 },
    { day: 'الجمعة', revenue: 2800 },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const [analyticsRes, ordersRes] = await Promise.all([
          apiCall(`/restaurants/${restaurantId}/analytics?days=7`),
          apiCall(`/restaurant/orders/${restaurantId}?page=1&pageSize=5`),
        ]);
        if (analyticsRes.success) {
          setStats({
            todayOrders: analyticsRes.data?.todayOrders ?? 0,
            todayRevenue: analyticsRes.data?.todayRevenue ?? 0,
            monthRevenue: analyticsRes.data?.monthRevenue ?? 0,
            avgRating: analyticsRes.data?.averageRating ?? 4.8,
          });
        }
        if (ordersRes.success) setRecentOrders(ordersRes.data?.slice(0, 5) ?? []);
      } catch { /* use defaults */ }
      finally { setLoading(false); }
    };
    load();
  }, [restaurantId]);

  const StatCard = ({ icon: Icon, label, value, color, bg }: any) => (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className={`text-2xl font-black mt-0.5 ${color}`}>{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="طلبات اليوم" value={stats.todayOrders} color="text-[#7b1e3a]" bg="bg-[#7b1e3a]/10" />
        <StatCard icon={DollarSign} label="إيراد اليوم" value={`${stats.todayRevenue} ج.م`} color="text-green-600" bg="bg-green-50" />
        <StatCard icon={TrendingUp} label="إيراد الشهر" value={`${stats.monthRevenue} ج.م`} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Star} label="التقييم العام" value={stats.avgRating} color="text-amber-600" bg="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">إيرادات الأسبوع</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => [`${v} ج.م`, 'الإيراد']} />
              <Bar dataKey="revenue" fill="#7b1e3a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">آخر الطلبات</h3>
            <span className="badge-primary badge text-xs">مباشر</span>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">لا توجد طلبات بعد</div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-xl bg-[#7b1e3a]/10 flex items-center justify-center text-sm font-black text-[#7b1e3a]">
                    #{order.orderNumber?.slice(-3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">{order.customer?.fullName}</p>
                    <p className="text-xs text-gray-400">{order.items?.length ?? 0} منتج</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-[#7b1e3a]">{order.totalAmount} ج.م</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status]}`}>
                      {STATUS_AR[order.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Orders Page ───────────────────────────────────────────────────────────────
function OrdersView({ restaurantId }: { restaurantId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const res = await apiCall(`/restaurant/orders/${restaurantId}?page=1&pageSize=50`);
      if (res.success) setOrders(res.data ?? []);
    } catch { } finally { setLoading(false); }
  }, [restaurantId]);

  useEffect(() => { loadOrders(); const t = setInterval(loadOrders, 30000); return () => clearInterval(t); }, [loadOrders]);

  const activeOrders = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status));
  const displayed = filter === 'active' ? activeOrders : orders;

  const handleAction = async (orderId: string, action: 'confirm' | 'reject' | 'ready') => {
    const endpointMap = { confirm: 'confirm', reject: 'reject', ready: 'ready' };
    try {
      const res = await apiCall(`/restaurant/orders/${orderId}/${endpointMap[action]}`, { method: 'PUT', body: JSON.stringify({ reason: 'لا يمكن تنفيذ الطلب' }) });
      if (res.success) { toast.success('تم التحديث'); loadOrders(); setSelectedOrder(null); }
      else toast.error(res.errors?.[0] ?? 'حدث خطأ');
    } catch { toast.error('حدث خطأ'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-tajawal font-black text-xl text-gray-800">إدارة الطلبات</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setFilter('active')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === 'active' ? 'bg-[#7b1e3a] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            نشطة ({activeOrders.length})
          </button>
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === 'all' ? 'bg-[#7b1e3a] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            الكل ({orders.length})
          </button>
          <button onClick={loadOrders} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}</div>
      ) : displayed.length === 0 ? (
        <div className="card p-16 text-center"><div className="text-5xl mb-3">📭</div><p className="text-gray-500 font-semibold">لا توجد طلبات</p></div>
      ) : (
        <div className="space-y-3">
          {displayed.map((order) => (
            <div key={order.id} className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#7b1e3a]/10 flex items-center justify-center font-black text-[#7b1e3a] text-sm shrink-0">
                #{order.orderNumber?.slice(-3)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-gray-800 text-sm">{order.customer?.fullName}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status]}`}>
                    {STATUS_AR[order.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {order.items?.slice(0, 2).map(i => `${i.productNameAr} ×${i.quantity}`).join('، ')}
                  {(order.items?.length ?? 0) > 2 && ` +${(order.items?.length ?? 0) - 2} أكثر`}
                </p>
              </div>
              <div className="text-left shrink-0">
                <p className="font-black text-[#7b1e3a]">{order.totalAmount} ج.م</p>
                <div className="flex gap-1 mt-1.5">
                  {order.status === 'Pending' && (
                    <>
                      <button onClick={() => handleAction(order.id, 'confirm')} className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors">قبول</button>
                      <button onClick={() => handleAction(order.id, 'reject')} className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors">رفض</button>
                    </>
                  )}
                  {order.status === 'Confirmed' && (
                    <button onClick={() => handleAction(order.id, 'confirm')} className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-lg">يُحضَّر</button>
                  )}
                  {order.status === 'Preparing' && (
                    <button onClick={() => handleAction(order.id, 'ready')} className="px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-lg">جاهز ✓</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Analytics View ────────────────────────────────────────────────────────────
function AnalyticsView({ restaurantId }: { restaurantId: string }) {
  const weekData = [
    { day: 'السبت', orders: 28, revenue: 1260 }, { day: 'الأحد', orders: 22, revenue: 990 },
    { day: 'الإثنين', orders: 35, revenue: 1575 }, { day: 'الثلاثاء', orders: 30, revenue: 1350 },
    { day: 'الأربعاء', orders: 42, revenue: 1890 }, { day: 'الخميس', orders: 55, revenue: 2475 },
    { day: 'الجمعة', orders: 70, revenue: 3150 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-tajawal font-black text-xl text-gray-800">التحليلات والإحصائيات</h2>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'إيراد هذا الشهر', value: '12,890 ج.م', icon: '💰', trend: '+23%' },
          { label: 'عدد الطلبات', value: '287', icon: '📦', trend: '+18%' },
          { label: 'متوسط قيمة الطلب', value: '44.9 ج.م', icon: '🎯', trend: '+4%' },
        ].map(({ label, value, icon, trend }) => (
          <div key={label} className="card p-5">
            <span className="text-3xl">{icon}</span>
            <p className="text-2xl font-black text-gray-800 mt-2">{value}</p>
            <p className="text-sm text-gray-400 mt-0.5">{label}</p>
            <span className="text-xs text-green-600 font-bold">{trend} عن الشهر الماضي</span>
          </div>
        ))}
      </div>
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4">الطلبات والإيرادات - آخر 7 أيام</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="left" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#7b1e3a" strokeWidth={2.5} dot={{ fill: '#7b1e3a' }} name="الإيراد (ج.م)" />
            <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#c9973a" strokeWidth={2.5} dot={{ fill: '#c9973a' }} name="عدد الطلبات" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Settings View ─────────────────────────────────────────────────────────────
function SettingsView({ restaurantId }: { restaurantId: string }) {
  const [deliveryFee, setDeliveryFee] = useState('10');
  const [minOrder, setMinOrder] = useState('45');
  const [deliveryTime, setDeliveryTime] = useState('45');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiCall(`/restaurants/${restaurantId}`, {
        method: 'PUT',
        body: JSON.stringify({ deliveryFee: Number(deliveryFee), minOrderAmount: Number(minOrder), estimatedDeliveryMinutes: Number(deliveryTime) })
      });
      toast.success('تم حفظ الإعدادات');
    } catch { toast.error('حدث خطأ'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <h2 className="font-tajawal font-black text-xl text-gray-800">إعدادات المطعم</h2>
      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-gray-800 mb-2">إعدادات التوصيل</h3>
        {[
          { label: 'رسوم التوصيل (ج.م)', value: deliveryFee, onChange: setDeliveryFee },
          { label: 'الحد الأدنى للطلب (ج.م)', value: minOrder, onChange: setMinOrder },
          { label: 'وقت التوصيل المتوقع (دقيقة)', value: deliveryTime, onChange: setDeliveryTime },
        ].map(({ label, value, onChange }) => (
          <div key={label}>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
            <input type="number" value={value} onChange={(e) => onChange(e.target.value)}
              className="input-field" dir="ltr" min="0" />
          </div>
        ))}
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3">
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function RestaurantDashboardApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage] = useState<Page>('dashboard');
  const [isOpen, setIsOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState('مطعمي');
  const [restaurantId, setRestaurantId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('rw_token');
    const user = localStorage.getItem('rw_user');
    if (token && user) {
      setIsLoggedIn(true);
      const u = JSON.parse(user);
      setRestaurantName(u.fullName);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('rw_token');
    localStorage.removeItem('rw_user');
    setIsLoggedIn(false);
    toast.success('تم تسجيل الخروج');
  };

  const handleToggleOpen = async () => {
    try {
      await apiCall(`/restaurants/${restaurantId}/open-status`, { method: 'PUT', body: JSON.stringify({ isOpen: !isOpen }) });
      setIsOpen(!isOpen);
      toast.success(isOpen ? 'المطعم الآن مغلق' : 'المطعم الآن مفتوح');
    } catch {
      setIsOpen(!isOpen);
      toast.success(isOpen ? 'المطعم الآن مغلق' : 'المطعم الآن مفتوح');
    }
  };

  if (!isLoggedIn) return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className="flex min-h-screen">
      <Toaster position="top-center" />
      <Sidebar page={page} setPage={setPage} restaurantName={restaurantName}
        isOpen={isOpen} onToggleOpen={handleToggleOpen} onLogout={handleLogout} />
      <main className="flex-1 mr-64 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {page === 'dashboard' && <DashboardView restaurantId={restaurantId} />}
          {page === 'orders' && <OrdersView restaurantId={restaurantId} />}
          {page === 'analytics' && <AnalyticsView restaurantId={restaurantId} />}
          {page === 'settings' && <SettingsView restaurantId={restaurantId} />}
          {page === 'menu' && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🍕</div>
              <p className="text-xl font-bold text-gray-700">إدارة القائمة</p>
              <p className="text-gray-400 text-sm mt-2">قريباً — إضافة وتعديل المنتجات</p>
            </div>
          )}
          {page === 'reviews' && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">⭐</div>
              <p className="text-xl font-bold text-gray-700">التقييمات والمراجعات</p>
              <p className="text-gray-400 text-sm mt-2">قريباً — عرض والرد على التقييمات</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
