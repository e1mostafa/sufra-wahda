'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart, Package, User } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'الرئيسية' },
  { href: '/search', icon: Search, label: 'بحث' },
  { href: '/cart', icon: ShoppingCart, label: 'السلة', isCart: true },
  { href: '/orders', icon: Package, label: 'طلباتي' },
  { href: '/profile', icon: User, label: 'حسابي' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCartStore();
  const hiddenRoutes = ['/login', '/register', '/verify-otp', '/checkout'];
  if (hiddenRoutes.some((r) => pathname.startsWith(r))) return null;

  return (
    <nav className="bottom-nav safe-bottom">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ href, icon: Icon, label, isCart }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all',
                isActive ? 'text-burgundy' : 'text-gray-400'
              )}
            >
              <div className="relative">
                <Icon
                  className={cn('w-5 h-5', isActive && 'stroke-[2.5]')}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {isCart && itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-burgundy text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-semibold',
                  isActive ? 'text-burgundy' : 'text-gray-400'
                )}
              >
                {label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-burgundy" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
