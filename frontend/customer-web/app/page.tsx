'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronLeft, MapPin, Search, ArrowLeft } from 'lucide-react';
import { restaurantService } from '@/services';
import { RestaurantCard, RestaurantCardSkeleton } from '@/components/restaurants/RestaurantCard';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuthStore } from '@/store/authStore';

const CATEGORIES = [
  { id: 'burger', name: 'برجر', emoji: '🍔' },
  { id: 'pizza', name: 'بيتزا', emoji: '🍕' },
  { id: 'chicken', name: 'دجاج', emoji: '🍗' },
  { id: 'sandwiches', name: 'سندوتشات', emoji: '🥙' },
  { id: 'grills', name: 'مشويات', emoji: '🍢' },
  { id: 'desserts', name: 'حلويات', emoji: '🍰' },
  { id: 'juices', name: 'مشروبات', emoji: '🧋' },
  { id: 'egyptian', name: 'مصري', emoji: '🥘' },
];

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();

  const { data: featuredData, isLoading: loadingFeatured } = useQuery({
    queryKey: ['restaurants', 'featured'],
    queryFn: () => restaurantService.getFeatured(6),
    staleTime: 5 * 60 * 1000,
  });

  const { data: allData, isLoading: loadingAll } = useQuery({
    queryKey: ['restaurants', 'all', { page: 1 }],
    queryFn: () => restaurantService.getAll({ page: 1, pageSize: 9 }),
    staleTime: 3 * 60 * 1000,
  });

  const featured = featuredData?.data ?? [];
  const all = allData?.data ?? [];

  return (
    <>
      <Header />
      <main className="pb-24 md:pb-8">
        {/* ─── Hero Banner ───────────────────────────────────────────── */}
        <section className="relative bg-gradient-to-br from-burgundy via-burgundy-800 to-burgundy-900 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 text-[120px] leading-none">🍽️</div>
            <div className="absolute bottom-2 left-8 text-[80px] leading-none">🍕</div>
            <div className="absolute top-10 left-1/3 text-[60px] leading-none">🍔</div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-14">
            <div className="max-w-lg">
              {isAuthenticated && user ? (
                <p className="text-white/80 text-sm mb-1">أهلاً، {user.fullName.split(' ')[0]} 👋</p>
              ) : null}
              <h1 className="font-tajawal font-black text-3xl md:text-4xl leading-tight mb-3">
                جوعان؟ احنا عندنا
                <br />
                <span className="text-gold-light">أكل أحلى المنيا! 🔥</span>
              </h1>
              <p className="text-white/70 text-sm mb-6">
                اطلب من أحسن مطاعم المنيا ووصّلناها لك في ٤٥ دقيقة أو أقل
              </p>

              {/* Search bar in hero */}
              <Link
                href="/search"
                className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-burgundy-xl hover:shadow-2xl transition-all group"
              >
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <span className="text-gray-400 text-sm flex-1">ابحث عن مطعم أو أكلة...</span>
                <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 rounded-lg px-2 py-1">
                  <MapPin className="w-3 h-3 text-burgundy" />
                  <span>المنيا</span>
                </div>
              </Link>

              {/* Quick stats */}
              <div className="flex gap-6 mt-6">
                {[
                  { num: '٣٠+', label: 'مطعم' },
                  { num: '٤٥ د', label: 'متوسط التوصيل' },
                  { num: '٢٤/٧', label: 'خدمة العملاء' },
                ].map(({ num, label }) => (
                  <div key={label} className="text-center">
                    <div className="font-tajawal font-black text-xl text-gold-light">{num}</div>
                    <div className="text-white/60 text-xs">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Categories ────────────────────────────────────────────── */}
        <section className="py-6 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title text-lg">تصفح حسب التصنيف</h2>
              <Link href="/search" className="text-burgundy text-sm font-semibold flex items-center gap-1">
                الكل <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/search?category=${cat.id}`}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-2xl hover:bg-burgundy/5 hover:border-burgundy/20 border-2 border-transparent transition-all group cursor-pointer"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">
                    {cat.emoji}
                  </span>
                  <span className="text-xs font-semibold text-gray-700 text-center">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Featured Restaurants ────────────────────────────────── */}
        {(loadingFeatured || featured.length > 0) && (
          <section className="py-6 px-4 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="section-title text-xl">🌟 المطاعم المميزة</h2>
                  <p className="section-subtitle">الأعلى تقييماً هذا الأسبوع</p>
                </div>
                <Link
                  href="/restaurants?featured=true"
                  className="text-burgundy text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  عرض الكل <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {loadingFeatured
                  ? Array.from({ length: 3 }).map((_, i) => <RestaurantCardSkeleton key={i} />)
                  : featured.slice(0, 6).map((r) => (
                      <RestaurantCard key={r.id} restaurant={r} />
                    ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Promo Banner ────────────────────────────────────────── */}
        <section className="px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-gold to-gold-dark rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="font-tajawal font-black text-xl text-gray-800">
                  أول طلب مجاناً! 🎁
                </p>
                <p className="text-gray-700 text-sm mt-1">
                  استخدم كود <strong>سُفرة50</strong> واحصل على خصم ٥٠٪
                </p>
              </div>
              <div className="text-5xl">🎊</div>
            </div>
          </div>
        </section>

        {/* ─── All Restaurants ─────────────────────────────────────── */}
        <section className="py-6 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title text-xl">🏪 جميع المطاعم</h2>
                <p className="section-subtitle">الكل متاح للتوصيل دلوقتي</p>
              </div>
              <Link
                href="/restaurants"
                className="text-burgundy text-sm font-semibold flex items-center gap-1"
              >
                عرض الكل <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {loadingAll
                ? Array.from({ length: 6 }).map((_, i) => <RestaurantCardSkeleton key={i} />)
                : all.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
            </div>

            {!loadingAll && all.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🏚️</div>
                <p className="text-gray-500 text-lg font-semibold">
                  لا توجد مطاعم متاحة الآن
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  سيتم إضافة المطاعم قريباً
                </p>
              </div>
            )}

            {!loadingAll && all.length > 0 && (
              <div className="text-center mt-8">
                <Link href="/restaurants" className="btn-secondary inline-flex items-center gap-2">
                  عرض جميع المطاعم
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ─── How it Works ─────────────────────────────────────────── */}
        <section className="py-10 px-4 bg-gradient-to-br from-burgundy to-burgundy-900 text-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-tajawal font-black text-2xl text-center mb-8">
              ⚡ إزاي بتشتغل سُفرة واحدة؟
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: '📱', step: '١', title: 'فتح التطبيق', desc: 'سجّل حساب مجاني في ثواني' },
                { icon: '🔍', step: '٢', title: 'اختار مطعمك', desc: 'تصفح مطاعم المنيا' },
                { icon: '🛒', step: '٣', title: 'اطلب أكلك', desc: 'أضف للسلة وادفع بأمان' },
                { icon: '🚴', step: '٤', title: 'استنى وتابع', desc: 'وصّلناها لحد بابك' },
              ].map(({ icon, step, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl mx-auto mb-3 border border-white/20">
                    {icon}
                  </div>
                  <div className="w-6 h-6 rounded-full bg-gold text-gray-800 text-xs font-black flex items-center justify-center mx-auto mb-2">
                    {step}
                  </div>
                  <h3 className="font-bold text-sm mb-1">{title}</h3>
                  <p className="text-white/60 text-xs">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
