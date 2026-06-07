'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, Clock, ChevronLeft } from 'lucide-react';
import { RestaurantSummary } from '@/types';
import { cn, formatPrice, formatRating } from '@/lib/utils';
import { useState } from 'react';
import { favoritesService } from '@/services';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface Props {
  restaurant: RestaurantSummary;
  className?: string;
  size?: 'default' | 'compact' | 'featured';
}

export function RestaurantCard({ restaurant, className, size = 'default' }: Props) {
  const { isAuthenticated } = useAuthStore();
  const [isFavorite, setIsFavorite] = useState(restaurant.isFavorite ?? false);
  const [isToggling, setIsToggling] = useState(false);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('سجّل دخول أولاً لإضافة للمفضلة');
      return;
    }
    setIsToggling(true);
    try {
      if (isFavorite) {
        await favoritesService.removeRestaurant(restaurant.id);
        toast.success('تم الإزالة من المفضلة');
      } else {
        await favoritesService.addRestaurant(restaurant.id);
        toast.success('تم الإضافة للمفضلة ❤️');
      }
      setIsFavorite(!isFavorite);
    } catch {
      toast.error('حدث خطأ، حاول مرة أخرى');
    } finally {
      setIsToggling(false);
    }
  };

  const coverBg = !restaurant.coverImageUrl
    ? 'bg-gradient-to-br from-burgundy to-burgundy-900'
    : '';

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className={cn('card-hover block group', className)}
    >
      {/* Cover */}
      <div className={cn('relative overflow-hidden', size === 'compact' ? 'h-32' : 'h-44')}>
        {restaurant.coverImageUrl ? (
          <Image
            src={restaurant.coverImageUrl}
            alt={restaurant.nameAr}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className={cn(coverBg, 'w-full h-full flex items-center justify-center text-6xl')}>
            🍽️
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          {restaurant.isOpen ? (
            <span className="badge bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              مفتوح
            </span>
          ) : (
            <span className="badge bg-gray-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              مغلق
            </span>
          )}
        </div>

        {/* Featured badge */}
        {restaurant.isFeatured && (
          <div className="absolute top-3 left-3">
            <span className="badge bg-gold text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              ⭐ مميز
            </span>
          </div>
        )}

        {/* Favorite button */}
        <button
          onClick={handleFavorite}
          disabled={isToggling}
          className={cn(
            'absolute bottom-3 left-3 w-8 h-8 rounded-full flex items-center justify-center',
            'bg-white/90 shadow-md transition-all duration-200',
            isToggling && 'opacity-50',
            isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
          )}
        >
          <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
        </button>

        {/* Logo */}
        {restaurant.logoUrl && (
          <div className="absolute bottom-3 right-3 w-12 h-12 rounded-xl bg-white shadow-md overflow-hidden">
            <Image
              src={restaurant.logoUrl}
              alt=""
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-gray-800 text-base leading-tight mb-1.5 line-clamp-1">
          {restaurant.nameAr}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-sm mb-3">
          <span className={cn('flex items-center gap-1 font-bold', 'text-amber-500')}>
            <Star className="w-3.5 h-3.5 fill-current" />
            {formatRating(restaurant.averageRating)}
            <span className="text-gray-400 font-normal text-xs">
              ({restaurant.totalRatings})
            </span>
          </span>
          <span className="text-gray-300">•</span>
          <span className="flex items-center gap-1 text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            {restaurant.estimatedDeliveryMinutes} د
          </span>
          {restaurant.categoryName && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-gray-400 text-xs">{restaurant.categoryName}</span>
            </>
          )}
        </div>

        {/* Tags */}
        {restaurant.tags && restaurant.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {restaurant.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge badge-primary text-[10px]">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="text-sm">
            <span className="text-gray-400 text-xs">توصيل: </span>
            <span className="font-bold text-burgundy">
              {restaurant.deliveryFee === 0 ? 'مجاني' : formatPrice(restaurant.deliveryFee)}
            </span>
          </div>
          <div className="text-xs text-gray-400">
            حد أدنى {formatPrice(restaurant.minOrderAmount)}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Skeleton loading card
export function RestaurantCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-44" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="flex gap-2">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
        <div className="skeleton h-4 w-full rounded" />
      </div>
    </div>
  );
}
