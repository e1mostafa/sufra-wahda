'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Store, Users, Car, Package, Tag, Megaphone,
  BarChart3, Settings, LogOut, Search, ChevronLeft, ChevronRight,
  Check, X, AlertTriangle, Eye, Ban, TrendingUp, DollarSign,
  ShoppingBag, Star, RefreshCw, Filter, Download, Bell, Percent
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import toast, { Toaster } from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ─── API helper ───────────────────────────────────────────────────────────────
async function apiCall(path: string, opts: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : '';
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers },
  });
  if (!res.ok && res.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.reload();
  }
  return res.json();
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type Page = 'dashboard' | 'restaurants' | 'customers' | 'drivers' | 'orders' | 'coupons' | 'ads' | 'analytics' | 'settings';

interface Restaurant { id: string; nameAr: string; city: string; phone: string; status: string; averageRating: number; totalOrders: number; commissionPercentage: number; createdAt: string; ownerName?: string; }
interface User { id: string; fullName: string; phone: string; email?: string; status: string; loyaltyPoints: number; createdAt: string; lastLoginAt?: string; }
interface Driver extends User { driverStatus?: string; totalDeliveries?: number; averageRating?: number; }
interface DashboardStats { totalRestaurants: number; activeRestaurants: number; pendingRestaurants: number; totalCustomers: number; totalDrivers: number; activeDrivers: number; todayOrders: number; todayRevenue: number; todayCommission: number; monthOrders: number; monthRevenue: number; monthCommission: number; }

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-700', Suspended: 'bg-red-100 text-red-700',
  PendingApproval: 'bg-amber-100 text-amber-700', Inactive: 'bg-gray-100 text-gray-600',
  PendingVerification: 'bg-blue-100 text-blue-700',
};
const STATUS_AR: Record<string, string> = {
  Active: 'نشط', Suspended: 'موقوف', PendingApproval: 'في الانتظار',
  Inactive: 'غير نشط', PendingVerification: 'لم يتحقق',
};

// ─── Login Screen ──────────────────────────────────────────────────────────────
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
        const user = data.data.user;
        if (!['Admin', 'SuperAdmin'].includes(user.role)) {
          toast.error('غير مصرح — هذه اللوحة للمديرين فقط'); return;
        }
        localStorage.setItem('admin_token', data.data.accessToken);
        localStorage.setItem('admin_user', JSON.stringify(user));
        onLogin();
        toast.success(`أهلاً ${user.fullName} 👋`);
      } else {
        toast.error(data.errors?.[0] || 'بيانات خاطئة');
      }
    } catch { toast.error('تعذر الاتصال بالخادم'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-[#3d0a1c] p-4">
      <Toaster position="top-center" />
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#7b1e3a] to-[#5c1429] rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">🛡️</div>
          <h1 className="text-2xl font-black text-gray-900">لوحة الإدارة</h1>
          <p className="text-gray-400 text-sm mt-1">سُفرة واحدة — Admin Portal</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">رقم الهاتف</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx" className="input-field" dir="ltr" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" className="input-field" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base mt-2">
            {loading ? '⏳ جاري التحقق...' : '🔐 دخول لوحة الإدارة'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-4">للمديرين المصرح لهم فقط</p>
      </div>
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────
const NAV_ITEMS: { id: Page; icon: any; label: string; badge?: string }[] = [
  { id: 'dashboard',   icon: LayoutDashboard, label: 'الرئيسية' },
  { id: 'restaurants', icon: Store,           label: 'المطاعم',   badge: 'pending' },
  { id: 'customers',   icon: Users,           label: 'العملاء' },
  { id: 'drivers',     icon: Car,             label: 'السائقون' },
  { id: 'orders',      icon: Package,         label: 'الطلبات' },
  { id: 'coupons',     icon: Tag,             label: 'الكوبونات' },
  { id: 'ads',         icon: Megaphone,       label: 'الإعلانات' },
  { id: 'analytics',   icon: BarChart3,       label: 'التحليلات' },
  { id: 'settings',    icon: Settings,        label: 'الإعدادات' },
];

function Sidebar({ page, setPage, adminName, pendingCount, onLogout }:
  { page: Page; setPage: (p: Page) => void; adminName: string; pendingCount: number; onLogout: () => void }) {
  return (
    <aside className="w-60 bg-gray-900 min-h-screen flex flex-col fixed right-0 top-0 bottom-0 z-50 shadow-2xl">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#7b1e3a] rounded-xl flex items-center justify-center text-lg">🛡️</div>
          <div>
            <p className="text-white font-black text-sm">سُفرة واحدة</p>
            <p className="text-gray-400 text-[11px]">Admin Portal</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#7b1e3a] flex items-center justify-center text-sm text-white font-bold">
            {adminName[0]}
          </div>
          <div>
            <p className="text-white text-xs font-semibold truncate max-w-[120px]">{adminName}</p>
            <p className="text-green-400 text-[10px]">● متصل</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, icon: Icon, label, badge }) => (
          <button key={id} onClick={() => setPage(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-right ${page === id ? 'bg-[#7b1e3a] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {badge === 'pending' && pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
          <LogOut className="w-4 h-4" /> تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

// ─── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-400 text-sm mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500">
          <Bell className="w-4 h-4" />
        </button>
        <button onClick={() => window.location.reload()} className="p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, bg, trend }:
  { icon: any; label: string; value: string | number; sub?: string; color: string; bg: string; trend?: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {trend && <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-full">{trend}</span>}
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-gray-500 text-xs font-medium mt-0.5">{label}</p>
      {sub && <p className="text-gray-400 text-[11px] mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Dashboard View ────────────────────────────────────────────────────────────
function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const revenueData = [
    { month: 'يناير', revenue: 8500, commission: 1275 },
    { month: 'فبراير', revenue: 12000, commission: 1800 },
    { month: 'مارس', revenue: 15500, commission: 2325 },
    { month: 'أبريل', revenue: 11000, commission: 1650 },
    { month: 'مايو', revenue: 18000, commission: 2700 },
    { month: 'يونيو', revenue: 22000, commission: 3300 },
  ];

  const categoryData = [
    { name: 'برجر', value: 35, color: '#7b1e3a' },
    { name: 'بيتزا', value: 25, color: '#c9973a' },
    { name: 'مصري', value: 20, color: '#2563eb' },
    { name: 'دجاج', value: 12, color: '#16a34a' },
    { name: 'أخرى', value: 8, color: '#6b7280' },
  ];

  useEffect(() => {
    apiCall('/admin/dashboard').then((res) => {
      if (res.success) setStats(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const s = stats ?? { totalRestaurants: 0, activeRestaurants: 0, pendingRestaurants: 0, totalCustomers: 0, totalDrivers: 0, activeDrivers: 0, todayOrders: 0, todayRevenue: 0, todayCommission: 0, monthOrders: 0, monthRevenue: 0, monthCommission: 0 };

  return (
    <div className="space-y-6">
      <Topbar title="لوحة التحكم الرئيسية" subtitle="نظرة عامة على المنصة" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Store}       label="المطاعم الكلية"   value={s.totalRestaurants}   sub={`${s.activeRestaurants} نشطة • ${s.pendingRestaurants} انتظار`} color="text-[#7b1e3a]" bg="bg-[#7b1e3a]/10" trend="+3 هذا الشهر" />
        <StatCard icon={Users}       label="إجمالي العملاء"   value={s.totalCustomers}     sub="عميل مسجل"   color="text-blue-600" bg="bg-blue-50"   trend="+47 هذا الأسبوع" />
        <StatCard icon={Car}         label="السائقون"          value={s.totalDrivers}       sub={`${s.activeDrivers} نشط الآن`} color="text-green-600" bg="bg-green-50"  />
        <StatCard icon={ShoppingBag} label="طلبات اليوم"       value={s.todayOrders}        sub={`${s.todayRevenue} ج.م إيراد`} color="text-purple-600" bg="bg-purple-50" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={DollarSign}  label="إيراد الشهر"       value={`${(s.monthRevenue).toLocaleString()} ج.م`}    color="text-green-700" bg="bg-green-50" trend="+23%" />
        <StatCard icon={Percent}     label="عمولة الشهر"        value={`${(s.monthCommission).toLocaleString()} ج.م`} color="text-[#7b1e3a]" bg="bg-[#7b1e3a]/10" />
        <StatCard icon={TrendingUp}  label="طلبات الشهر"        value={s.monthOrders}        color="text-amber-700"  bg="bg-amber-50"  trend="+18%" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card p-5 col-span-2">
          <h3 className="font-bold text-gray-800 mb-4">الإيرادات والعمولات (6 أشهر)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7b1e3a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7b1e3a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="comGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#c9973a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#c9973a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any, n: string) => [`${v.toLocaleString()} ج.م`, n === 'revenue' ? 'الإيراد' : 'العمولة']} />
              <Area type="monotone" dataKey="revenue"    stroke="#7b1e3a" strokeWidth={2.5} fill="url(#revGrad)" name="revenue" />
              <Area type="monotone" dataKey="commission" stroke="#c9973a" strokeWidth={2}   fill="url(#comGrad)" name="commission" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">توزيع التصنيفات</h3>
          <PieChart width={180} height={180}>
            <Pie data={categoryData} cx={90} cy={90} innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
              {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
          <div className="space-y-2 mt-2">
            {categoryData.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                  <span className="text-gray-600">{c.name}</span>
                </div>
                <span className="font-bold text-gray-800">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Restaurants View ──────────────────────────────────────────────────────────
function RestaurantsView({ onPendingChange }: { onPendingChange: (n: number) => void }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [pending, setPending] = useState<Restaurant[]>([]);
  const [tab, setTab] = useState<'all' | 'pending'>('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [commissionModal, setCommissionModal] = useState<{ id: string; name: string; current: number } | null>(null);
  const [newCommission, setNewCommission] = useState('');

  const load = useCallback(async () => {
    try {
      const [allRes, pendingRes] = await Promise.all([
        apiCall('/admin/restaurants?page=1&pageSize=100'),
        apiCall('/admin/restaurants/pending'),
      ]);
      if (allRes.success)     setRestaurants(allRes.data?.items ?? allRes.data ?? []);
      if (pendingRes.success) { setPending(pendingRes.data ?? []); onPendingChange((pendingRes.data ?? []).length); }
    } catch { } finally { setLoading(false); }
  }, [onPendingChange]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string) => {
    const res = await apiCall(`/admin/restaurants/${id}/approve`, { method: 'PUT' });
    if (res.success) { toast.success('تم الموافقة على المطعم ✅'); load(); }
    else toast.error(res.errors?.[0] ?? 'حدث خطأ');
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) { toast.error('يرجى كتابة سبب الرفض'); return; }
    const res = await apiCall(`/admin/restaurants/${rejectModal.id}/reject`, { method: 'PUT', body: JSON.stringify({ reason: rejectReason }) });
    if (res.success) { toast.success('تم الرفض'); setRejectModal(null); setRejectReason(''); load(); }
    else toast.error(res.errors?.[0] ?? 'حدث خطأ');
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('هل أنت متأكد من تعليق المطعم؟')) return;
    const res = await apiCall(`/admin/restaurants/${id}/suspend`, { method: 'PUT' });
    if (res.success) { toast.success('تم تعليق المطعم'); load(); }
    else toast.error('حدث خطأ');
  };

  const handleUpdateCommission = async () => {
    if (!commissionModal || !newCommission) return;
    const res = await apiCall(`/admin/restaurants/${commissionModal.id}/commission`, {
      method: 'PUT', body: JSON.stringify({ commissionPercentage: Number(newCommission) })
    });
    if (res.success) { toast.success('تم تحديث العمولة'); setCommissionModal(null); load(); }
    else toast.error('حدث خطأ');
  };

  const displayed = (tab === 'pending' ? pending : restaurants)
    .filter(r => !search || r.nameAr.includes(search));

  return (
    <div>
      <Topbar title="إدارة المطاعم" subtitle={`${restaurants.length} مطعم مسجل`} />

      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-2">
          {(['pending', 'all'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-[#7b1e3a] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
              {t === 'pending' ? `⏳ في الانتظار (${pending.length})` : `🏪 الكل (${restaurants.length})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs mr-auto">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم المطعم..." className="input-field pr-9 py-2 text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}</div>
      ) : displayed.length === 0 ? (
        <div className="card p-16 text-center"><div className="text-5xl mb-3">🏚️</div><p className="text-gray-500 font-semibold">لا توجد مطاعم</p></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-right">
                {['المطعم', 'المدينة', 'الهاتف', 'التقييم', 'الطلبات', 'العمولة', 'الحالة', 'إجراءات'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.map((r) => (
                <tr key={r.id} className="table-row">
                  <td className="px-4 py-3"><p className="font-semibold text-gray-800 text-sm">{r.nameAr}</p><p className="text-xs text-gray-400">{r.ownerName}</p></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.city}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono" dir="ltr">{r.phone}</td>
                  <td className="px-4 py-3"><span className="text-amber-600 font-bold text-sm">⭐ {r.averageRating?.toFixed(1) ?? '—'}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-bold">{r.totalOrders}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setCommissionModal({ id: r.id, name: r.nameAr, current: r.commissionPercentage })}
                      className="text-[#7b1e3a] font-bold text-sm hover:underline">{r.commissionPercentage}%</button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-[11px] ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_AR[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {r.status === 'PendingApproval' && (
                        <>
                          <button onClick={() => handleApprove(r.id)} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" title="موافقة"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setRejectModal({ id: r.id, name: r.nameAr })} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors" title="رفض"><X className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                      {r.status === 'Active' && (
                        <button onClick={() => handleSuspend(r.id)} className="p-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors" title="تعليق"><Ban className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg text-gray-800 mb-1">رفض المطعم</h3>
            <p className="text-gray-400 text-sm mb-4">{rejectModal.name}</p>
            <label className="block text-sm font-semibold text-gray-700 mb-2">سبب الرفض</label>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="اكتب سبب الرفض هنا..." rows={3} className="input-field resize-none text-sm" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectModal(null)} className="btn-ghost flex-1">إلغاء</button>
              <button onClick={handleReject} className="btn-danger flex-1">رفض المطعم</button>
            </div>
          </div>
        </div>
      )}

      {/* Commission Modal */}
      {commissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-lg text-gray-800 mb-1">تعديل العمولة</h3>
            <p className="text-gray-400 text-sm mb-4">{commissionModal.name}</p>
            <label className="block text-sm font-semibold text-gray-700 mb-2">نسبة العمولة الجديدة (%)</label>
            <input type="number" value={newCommission || commissionModal.current}
              onChange={(e) => setNewCommission(e.target.value)}
              min="0" max="50" className="input-field" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setCommissionModal(null)} className="btn-ghost flex-1">إلغاء</button>
              <button onClick={handleUpdateCommission} className="btn-primary flex-1">حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Users View ────────────────────────────────────────────────────────────────
function UsersView({ type }: { type: 'customers' | 'drivers' }) {
  const [users, setUsers] = useState<(User | Driver)[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = type === 'customers' ? '/admin/users/customers' : '/admin/users/drivers';
    apiCall(path).then((res) => { if (res.success) setUsers(res.data ?? []); }).catch(() => {}).finally(() => setLoading(false));
  }, [type]);

  const handleSuspend = async (id: string) => {
    if (!confirm('تعليق الحساب؟')) return;
    const res = await apiCall(`/admin/users/${id}/suspend`, { method: 'PUT' });
    if (res.success) { toast.success('تم تعليق الحساب'); setUsers(u => u.map(x => x.id === id ? { ...x, status: 'Suspended' } : x)); }
    else toast.error('حدث خطأ');
  };

  const handleActivate = async (id: string) => {
    const res = await apiCall(`/admin/users/${id}/activate`, { method: 'PUT' });
    if (res.success) { toast.success('تم تفعيل الحساب'); setUsers(u => u.map(x => x.id === id ? { ...x, status: 'Active' } : x)); }
    else toast.error('حدث خطأ');
  };

  const filtered = users.filter(u => !search || u.fullName.includes(search) || u.phone.includes(search));
  const isDriver = type === 'drivers';

  return (
    <div>
      <Topbar title={isDriver ? 'إدارة السائقين' : 'إدارة العملاء'} subtitle={`${users.length} ${isDriver ? 'سائق' : 'عميل'} مسجل`} />

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={`بحث في ${isDriver ? 'السائقين' : 'العملاء'}...`} className="input-field pr-9 text-sm" />
        </div>
        <span className="text-sm text-gray-400 font-medium">{filtered.length} نتيجة</span>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-14 animate-pulse" />)}</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-right">
                {['الاسم', 'الهاتف', 'الحالة',
                  isDriver ? 'التوصيلات' : 'النقاط',
                  isDriver ? 'التقييم' : 'آخر دخول',
                  'إجراءات'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => {
                const d = u as Driver;
                return (
                  <tr key={u.id} className="table-row">
                    <td className="px-4 py-3"><p className="font-semibold text-gray-800 text-sm">{u.fullName}</p><p className="text-xs text-gray-400">{u.email}</p></td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono" dir="ltr">{u.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-[11px] ${STATUS_COLORS[u.status] ?? 'bg-gray-100'}`}>{STATUS_AR[u.status] ?? u.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-700">{isDriver ? (d.totalDeliveries ?? 0) : (u as User).loyaltyPoints}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{isDriver ? (d.averageRating ? `⭐ ${d.averageRating.toFixed(1)}` : '—') : (u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('ar-EG') : '—')}</td>
                    <td className="px-4 py-3">
                      {u.status === 'Active' ? (
                        <button onClick={() => handleSuspend(u.id)} className="p-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors" title="تعليق"><Ban className="w-3.5 h-3.5" /></button>
                      ) : u.status === 'Suspended' ? (
                        <button onClick={() => handleActivate(u.id)} className="p-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors" title="تفعيل"><Check className="w-3.5 h-3.5" /></button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12"><div className="text-4xl mb-2">👤</div><p className="text-gray-400">لا توجد نتائج</p></div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Analytics View ────────────────────────────────────────────────────────────
function AnalyticsView() {
  const weeklyData = [
    { day: 'السبت', orders: 45, revenue: 2025 }, { day: 'الأحد', orders: 38, revenue: 1710 },
    { day: 'الإثنين', orders: 62, revenue: 2790 }, { day: 'الثلاثاء', orders: 55, revenue: 2475 },
    { day: 'الأربعاء', orders: 78, revenue: 3510 }, { day: 'الخميس', orders: 95, revenue: 4275 },
    { day: 'الجمعة', orders: 120, revenue: 5400 },
  ];

  return (
    <div className="space-y-6">
      <Topbar title="التحليلات والتقارير" subtitle="أداء المنصة خلال الفترة الحالية" />
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'إيراد الشهر',    value: '45,280 ج.م',  color: 'text-green-700',   bg: 'bg-green-50',   trend: '+23%' },
          { icon: Percent,    label: 'عمولة الشهر',     value: '6,792 ج.م',   color: 'text-[#7b1e3a]',  bg: 'bg-[#7b1e3a]/10', },
          { icon: Package,    label: 'طلبات الشهر',     value: '893',          color: 'text-blue-700',    bg: 'bg-blue-50',    trend: '+18%' },
          { icon: Star,       label: 'متوسط التقييم',   value: '4.7 ⭐',       color: 'text-amber-700',   bg: 'bg-amber-50', },
        ].map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4">الطلبات والإيرادات — آخر 7 أيام</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={weeklyData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="left" tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left"  dataKey="revenue" fill="#7b1e3a" name="الإيراد (ج.م)" radius={[4,4,0,0]} />
            <Bar yAxisId="right" dataKey="orders"  fill="#c9973a" name="عدد الطلبات"   radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Coupons View ──────────────────────────────────────────────────────────────
function CouponsView() {
  const [coupons] = useState([
    { id: '1', code: 'سُفرة50', type: 'Percentage', value: 50, minOrder: 50, usedCount: 23, maxUses: 100, isActive: true, endDate: '2025-12-31' },
    { id: '2', code: 'WELCOME20', type: 'FixedAmount', value: 20, minOrder: 30, usedCount: 156, maxUses: 500, isActive: true, endDate: '2025-06-30' },
    { id: '3', code: 'FREEDEL', type: 'FreeDelivery', value: 0, minOrder: 40, usedCount: 89, maxUses: 200, isActive: false, endDate: '2025-03-31' },
  ]);

  const typeAr: Record<string, string> = { Percentage: 'نسبة %', FixedAmount: 'مبلغ ثابت', FreeDelivery: 'توصيل مجاني' };

  return (
    <div>
      <Topbar title="إدارة الكوبونات" subtitle="أكواد الخصم والعروض" />
      <div className="flex justify-end mb-4">
        <button className="btn-primary flex items-center gap-2"><Tag className="w-4 h-4" /> كوبون جديد</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-right">
              {['الكود', 'النوع', 'القيمة', 'حد أدنى', 'الاستخدام', 'تاريخ الانتهاء', 'الحالة'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-bold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {coupons.map((c) => (
              <tr key={c.id} className="table-row">
                <td className="px-4 py-3"><span className="font-mono font-black text-[#7b1e3a] bg-[#7b1e3a]/10 px-3 py-1 rounded-lg text-sm">{c.code}</span></td>
                <td className="px-4 py-3 text-sm text-gray-600">{typeAr[c.type]}</td>
                <td className="px-4 py-3 font-bold text-gray-800 text-sm">{c.type === 'Percentage' ? `${c.value}%` : c.type === 'FixedAmount' ? `${c.value} ج.م` : '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.minOrder} ج.م</td>
                <td className="px-4 py-3 text-sm"><span className="font-bold text-gray-800">{c.usedCount}</span><span className="text-gray-400">/{c.maxUses}</span></td>
                <td className="px-4 py-3 text-sm text-gray-500">{c.endDate}</td>
                <td className="px-4 py-3"><span className={`badge text-[11px] ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{c.isActive ? 'نشط' : 'منتهي'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Settings View ─────────────────────────────────────────────────────────────
function SettingsView() {
  const [commission, setCommission] = useState('15');
  const [deliveryFee, setDeliveryFee] = useState('10');
  const [loyaltyRate, setLoyaltyRate] = useState('1');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiCall('/admin/settings', { method: 'PUT', body: JSON.stringify({ default_commission: commission, default_delivery_fee: deliveryFee, loyalty_points_per_egp: loyaltyRate }) });
      toast.success('تم حفظ الإعدادات ✅');
    } catch { toast.error('حدث خطأ'); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <Topbar title="إعدادات المنصة" subtitle="التكوينات العامة للنظام" />
      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2">الإعدادات المالية</h3>
        {[
          { label: 'نسبة العمولة الافتراضية (%)', value: commission, onChange: setCommission, max: '50' },
          { label: 'رسوم التوصيل الافتراضية (ج.م)', value: deliveryFee, onChange: setDeliveryFee, max: '100' },
          { label: 'نقاط الولاء لكل جنيه', value: loyaltyRate, onChange: setLoyaltyRate, max: '10' },
        ].map(({ label, value, onChange, max }) => (
          <div key={label}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
            <input type="number" value={value} onChange={(e) => onChange(e.target.value)} min="0" max={max} className="input-field" dir="ltr" />
          </div>
        ))}
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 mt-2">
          {saving ? '⏳ جاري الحفظ...' : '💾 حفظ الإعدادات'}
        </button>
      </div>

      <div className="card p-6 space-y-3">
        <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2">معلومات النظام</h3>
        {[
          { label: 'الإصدار', value: 'v1.0.0' }, { label: 'البيئة', value: 'Production' },
          { label: 'المدن المفعّلة', value: 'المنيا' }, { label: 'المطوّر', value: 'سُفرة واحدة Team' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-bold text-gray-800 bg-gray-50 px-3 py-1 rounded-lg">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function AdminDashboardApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage] = useState<Page>('dashboard');
  const [adminName, setAdminName] = useState('مدير');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const user  = localStorage.getItem('admin_user');
    if (token && user) {
      setIsLoggedIn(true);
      setAdminName(JSON.parse(user).fullName);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) return <LoginScreen onLogin={() => { setIsLoggedIn(true); const u = localStorage.getItem('admin_user'); if (u) setAdminName(JSON.parse(u).fullName); }} />;

  return (
    <div className="flex min-h-screen">
      <Toaster position="top-center" />
      <Sidebar page={page} setPage={setPage} adminName={adminName} pendingCount={pendingCount} onLogout={handleLogout} />
      <main className="flex-1 mr-60 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {page === 'dashboard'   && <DashboardView />}
          {page === 'restaurants' && <RestaurantsView onPendingChange={setPendingCount} />}
          {page === 'customers'   && <UsersView type="customers" />}
          {page === 'drivers'     && <UsersView type="drivers" />}
          {page === 'coupons'     && <CouponsView />}
          {page === 'analytics'   && <AnalyticsView />}
          {page === 'settings'    && <SettingsView />}
          {(page === 'orders' || page === 'ads') && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">{page === 'orders' ? '📦' : '📢'}</div>
              <p className="text-xl font-bold text-gray-700">{page === 'orders' ? 'إدارة الطلبات' : 'إدارة الإعلانات'}</p>
              <p className="text-gray-400 text-sm mt-2">هذا القسم قيد التطوير</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
