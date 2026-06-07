'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { RestaurantCard, RestaurantCardSkeleton } from '@/components/restaurants/RestaurantCard';
import { restaurantService } from '@/services';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: '', name: 'الكل', emoji: '🍽️' },
  { id: 'burger', name: 'برجر', emoji: '🍔' },
  { id: 'pizza', name: 'بيتزا', emoji: '🍕' },
  { id: 'chicken', name: 'دجاج', emoji: '🍗' },
  { id: 'sandwiches', name: 'سندوتشات', emoji: '🥙' },
  { id: 'grills', name: 'مشويات', emoji: '🍢' },
  { id: 'desserts', name: 'حلويات', emoji: '🍰' },
  { id: 'egyptian', name: 'مصري', emoji: '🥘' },
  { id: 'juices', name: 'مشروبات', emoji: '🧋' },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSearch = searchParams.get('q') ?? '';
  const initialCategory = searchParams.get('category') ?? '';

  const [query, setQuery] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [isOpenOnly, setIsOpenOnly] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ['restaurants', 'search', debouncedQuery, activeCategory, isOpenOnly],
    queryFn: () => restaurantService.getAll({
      search: debouncedQuery || undefined,
      categoryId: activeCategory || undefined,
      isOpen: isOpenOnly || undefined,
      page: 1, pageSize: 30,
    }),
    staleTime: 30 * 1000,
  });

  const restaurants = data?.data ?? [];
  const hasFilters = !!debouncedQuery || !!activeCategory || isOpenOnly;

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 pb-28 pt-4">
        {/* Search Input */}
        <div className="relative mb-5">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن مطعم أو أكلة..."
            className="input-field pr-12 pl-10 py-4 text-base shadow-burgundy-sm"
            autoFocus />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 overflow-x-auto scrollbar-hide pb-1">
          <button onClick={() => setIsOpenOnly(!isOpenOnly)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold shrink-0 transition-all',
              isOpenOnly ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
            {isOpenOnly ? '✓' : ''} مفتوح الآن
          </button>

          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-sm font-semibold shrink-0 transition-all',
                activeCategory === cat.id
                  ? 'border-burgundy bg-burgundy text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
              <span>{cat.emoji}</span> {cat.name}
            </button>
          ))}
        </div>

        {/* Results header */}
        {!isLoading && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {restaurants.length > 0 ? (
                <><span className="font-bold text-gray-800">{restaurants.length}</span> نتيجة</>
              ) : (
                'لا توجد نتائج'
              )}
              {debouncedQuery && <> لـ "<span className="text-burgundy font-bold">{debouncedQuery}</span>"</>}
            </p>
            {hasFilters && (
              <button onClick={() => { setQuery(''); setActiveCategory(''); setIsOpenOnly(false); }}
                className="text-xs text-burgundy font-bold flex items-center gap-1">
                <X className="w-3 h-3" /> مسح الفلاتر
              </button>
            )}
          </div>
        )}

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
          </div>
        ) : restaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {restaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl font-semibold text-gray-700 mb-2">لا توجد نتائج</p>
            <p className="text-gray-400 text-sm">
              {debouncedQuery ? `لم نجد نتائج لـ "${debouncedQuery}"` : 'جرب تغيير الفلاتر'}
            </p>
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-4xl animate-bounce">🔍</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
