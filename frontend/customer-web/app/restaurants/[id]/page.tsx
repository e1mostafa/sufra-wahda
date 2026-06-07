'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star, Clock, MapPin, Phone, ArrowRight, ShoppingCart,
  Heart, Share2, ChevronDown, ChevronUp, Search
} from 'lucide-react';
import { restaurantService } from '@/services';
import { ProductModal } from '@/components/restaurants/ProductModal';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { useCartStore } from '@/store/cartStore';
import { Product } from '@/types';
import { cn, formatPrice, formatRating } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [showDifferentRestaurantModal, setShowDifferentRestaurantModal] = useState(false);
  const { itemCount, restaurantId: cartRestaurantId, clearCart } = useCartStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => restaurantService.getById(id),
    enabled: !!id,
  });

  const restaurant = data?.data;

  const filteredMenu = restaurant?.menu?.map((cat) => ({
    ...cat,
    products: cat.products.filter(
      (p) =>
        !productSearch ||
        p.nameAr.includes(productSearch) ||
        (p.descriptionAr?.includes(productSearch) ?? false)
    ),
  })).filter((cat) => cat.products.length > 0);

  const handleAddProduct = (product: Product) => {
    if (cartRestaurantId && cartRestaurantId !== id && itemCount > 0) {
      setSelectedProduct(product);
      setShowDifferentRestaurantModal(true);
      return;
    }
    setSelectedProduct(product);
  };

  const handleClearAndAdd = () => {
    clearCart();
    setShowDifferentRestaurantModal(false);
    // selectedProduct stays, modal will open
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="skeleton h-64 rounded-2xl mb-6" />
          <div className="skeleton h-8 w-2/3 rounded mb-3" />
          <div className="skeleton h-4 w-1/2 rounded mb-8" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl mb-3" />
          ))}
        </div>
        <BottomNav />
      </>
    );
  }

  if (!restaurant || error) {
    return (
      <>
        <Header />
        <div className="text-center py-20">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-xl font-semibold text-gray-700">المطعم غير موجود</p>
          <Link href="/" className="btn-primary mt-4 inline-block">العودة للرئيسية</Link>
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto pb-28">
        {/* Cover Image */}
        <div className="relative h-56 md:h-72 bg-gradient-to-br from-burgundy to-burgundy-900">
          {restaurant.coverImageUrl ? (
            <Image
              src={restaurant.coverImageUrl}
              alt={restaurant.nameAr}
              fill
              className="object-cover"
              sizes="900px"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl opacity-30">🍽️</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md"
          >
            <ArrowRight className="w-5 h-5 text-gray-700" />
          </button>

          {/* Actions */}
          <div className="absolute top-4 left-4 flex gap-2">
            <button className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md">
              <Heart className="w-4 h-4 text-gray-700" />
            </button>
            <button className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md">
              <Share2 className="w-4 h-4 text-gray-700" />
            </button>
          </div>

          {/* Status badge */}
          <div className="absolute bottom-4 right-4">
            <span
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-bold',
                restaurant.isOpen
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-600 text-white'
              )}
            >
              {restaurant.isOpen ? '🟢 مفتوح الآن' : '🔴 مغلق'}
            </span>
          </div>
        </div>

        <div className="px-4 md:px-6">
          {/* Restaurant Info */}
          <div className="bg-white rounded-2xl shadow-burgundy-md -mt-6 relative z-10 p-5 mb-4">
            <div className="flex items-start gap-4">
              {restaurant.logoUrl && (
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-md shrink-0">
                  <Image
                    src={restaurant.logoUrl}
                    alt=""
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="font-tajawal font-black text-2xl text-gray-800 mb-1">
                  {restaurant.nameAr}
                </h1>
                {restaurant.descriptionAr && (
                  <p className="text-gray-500 text-sm mb-2 line-clamp-2">{restaurant.descriptionAr}</p>
                )}
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-4 h-4 fill-current" />
                    {formatRating(restaurant.averageRating)}
                    <span className="text-gray-400 font-normal">({restaurant.totalRatings})</span>
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <Clock className="w-4 h-4" />
                    {restaurant.estimatedDeliveryMinutes} دقيقة
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <MapPin className="w-4 h-4" />
                    {restaurant.city}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery info */}
            <div className="flex gap-3 mt-4 p-3 bg-gray-50 rounded-xl">
              <div className="flex-1 text-center">
                <div className="font-bold text-burgundy">{formatPrice(restaurant.deliveryFee)}</div>
                <div className="text-xs text-gray-400">رسوم التوصيل</div>
              </div>
              <div className="w-px bg-gray-200" />
              <div className="flex-1 text-center">
                <div className="font-bold text-gray-800">{formatPrice(restaurant.minOrderAmount)}</div>
                <div className="text-xs text-gray-400">حد أدنى</div>
              </div>
              <div className="w-px bg-gray-200" />
              <div className="flex-1 text-center">
                <div className="font-bold text-gray-800">{restaurant.estimatedDeliveryMinutes} د</div>
                <div className="text-xs text-gray-400">وقت التوصيل</div>
              </div>
            </div>
          </div>

          {/* Menu Categories Tabs */}
          <div className="bg-white rounded-2xl shadow-burgundy-sm overflow-hidden mb-4">
            <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide border-b border-gray-100">
              {restaurant.menu?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(activeCategory === cat.id ? '' : cat.id)}
                  className={cn(
                    'shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                    activeCategory === cat.id
                      ? 'bg-burgundy text-white shadow-burgundy-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {cat.nameAr}
                  <span className="mr-1.5 text-xs opacity-70">({cat.products.length})</span>
                </button>
              ))}
            </div>

            {/* Product Search */}
            <div className="px-4 py-3 border-b border-gray-50">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="ابحث في القائمة..."
                  className="w-full pr-10 pl-4 py-2 text-sm rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:border-burgundy"
                />
              </div>
            </div>
          </div>

          {/* Menu Items */}
          {filteredMenu?.map((category) => (
            <div key={category.id} className="mb-4">
              <h3 className="font-tajawal font-bold text-lg text-gray-800 px-2 mb-3">
                {category.nameAr}
              </h3>
              <div className="space-y-3">
                {category.products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    disabled={!product.isAvailable}
                    className={cn(
                      'card w-full flex items-center gap-4 p-4 hover:shadow-burgundy-md transition-all text-right',
                      !product.isAvailable && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {product.imageUrl && (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0">
                        <Image
                          src={product.imageUrl}
                          alt={product.nameAr}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm leading-tight">
                            {product.nameAr}
                          </h4>
                          {product.descriptionAr && (
                            <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                              {product.descriptionAr}
                            </p>
                          )}
                          {product.calories && (
                            <span className="text-xs text-gray-400 mt-1 block">
                              🔥 {product.calories} سعر حراري
                            </span>
                          )}
                        </div>
                        <div className="text-left shrink-0">
                          <div className="font-black text-burgundy text-sm">
                            {formatPrice(product.effectivePrice)}
                          </div>
                          {product.discountedPrice && product.basePrice > product.discountedPrice && (
                            <div className="text-xs text-gray-400 line-through">
                              {formatPrice(product.basePrice)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-burgundy text-white flex items-center justify-center shrink-0">
                      <span className="text-lg leading-none">+</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Floating cart button */}
        {itemCount > 0 && cartRestaurantId === id && (
          <div className="fixed bottom-20 md:bottom-6 left-4 right-4 max-w-lg mx-auto z-40">
            <Link
              href="/cart"
              className="btn-primary w-full flex items-center justify-between px-6 py-4 rounded-2xl shadow-burgundy-xl"
            >
              <span className="bg-white/20 rounded-lg px-2 py-1 text-sm font-bold">
                {itemCount} منتج
              </span>
              <span className="font-bold">عرض السلة 🛒</span>
              <span className="font-bold opacity-0">xx</span>
            </Link>
          </div>
        )}
      </main>

      {/* Product Modal */}
      {selectedProduct && !showDifferentRestaurantModal && (
        <ProductModal
          product={selectedProduct}
          restaurantId={id}
          restaurantName={restaurant.nameAr}
          deliveryFee={restaurant.deliveryFee}
          onClose={() => setSelectedProduct(null)}
          onDifferentRestaurant={() => setShowDifferentRestaurantModal(true)}
        />
      )}

      {/* Different Restaurant Confirmation */}
      {showDifferentRestaurantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDifferentRestaurantModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="text-4xl text-center mb-4">🛒</div>
            <h3 className="font-bold text-xl text-center mb-2">إفتح سلة جديدة؟</h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              عندك منتجات من مطعم تاني في السلة. عايز تفرّغ السلة وتبدأ طلب جديد؟
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDifferentRestaurantModal(false)}
                className="flex-1 btn-secondary py-3"
              >
                إلغاء
              </button>
              <button
                onClick={handleClearAndAdd}
                className="flex-1 btn-primary py-3"
              >
                نعم، افرّغ السلة
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
