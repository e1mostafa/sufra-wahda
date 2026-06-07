'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ShoppingCart, Bell, Search, Menu, X, User, LogOut, Heart, Package } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    setUserMenuOpen(false);
  };

  const isHiddenOnMobile = ['/login', '/register', '/verify-otp'].includes(pathname);
  if (isHiddenOnMobile) return null;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-burgundy-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl gradient-burgundy flex items-center justify-center text-white text-lg shadow-burgundy-md">
              🍽️
            </div>
            <span className="font-tajawal font-black text-burgundy text-xl hidden sm:block">
              سُفرة واحدة
            </span>
          </Link>

          {/* Search - Desktop */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:flex">
            <div className="relative w-full">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن مطعم أو أكلة..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy
                           bg-gray-50 transition-all"
              />
            </div>
          </form>

          <div className="flex items-center gap-2 mr-auto">
            {/* Location badge */}
            <span className="hidden lg:flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1.5">
              📍 المنيا
            </span>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-burgundy text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full gradient-burgundy flex items-center justify-center text-white text-sm font-bold">
                    {user.fullName[0]}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {user.fullName}
                  </span>
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-burgundy-lg border border-gray-100 z-50 overflow-hidden animate-scale-in">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-bold text-gray-800 text-sm">{user.fullName}</p>
                        <p className="text-xs text-gray-400">{user.phone}</p>
                        {user.loyaltyPoints > 0 && (
                          <p className="text-xs text-gold-dark font-semibold mt-1">
                            🏆 {user.loyaltyPoints} نقطة
                          </p>
                        )}
                      </div>
                      <nav className="py-2">
                        {[
                          { href: '/profile', icon: User, label: 'ملفي الشخصي' },
                          { href: '/orders', icon: Package, label: 'طلباتي' },
                          { href: '/profile/favorites', icon: Heart, label: 'المفضلة' },
                          { href: '/profile/notifications', icon: Bell, label: 'الإشعارات' },
                        ].map(({ href, icon: Icon, label }) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                          >
                            <Icon className="w-4 h-4 text-gray-400" />
                            {label}
                          </Link>
                        ))}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-sm text-red-600 w-full transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            تسجيل الخروج
                          </button>
                        </div>
                      </nav>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn-ghost text-sm py-2 px-3">
                  دخول
                </Link>
                <Link href="/register" className="btn-primary text-sm py-2 px-4">
                  سجّل الآن
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مطعم أو أكلة..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm
                         focus:outline-none focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy
                         bg-gray-50 transition-all"
            />
          </div>
        </form>
      </div>
    </header>
  );
}
