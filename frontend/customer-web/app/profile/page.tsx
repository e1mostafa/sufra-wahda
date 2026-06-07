'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, MapPin, Heart, Bell, Star, LogOut, ChevronLeft, Gift, Phone } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/profile/addresses', icon: MapPin, label: 'عناويني', desc: 'إدارة عناوين التوصيل' },
  { href: '/profile/favorites', icon: Heart, label: 'المفضلة', desc: 'مطاعمك المفضلة' },
  { href: '/orders', icon: Star, label: 'طلباتي', desc: 'سجل الطلبات والتقييمات' },
  { href: '/profile/notifications', icon: Bell, label: 'الإشعارات', desc: 'تنبيهات الطلبات والعروض' },
  { href: '/profile/loyalty', icon: Gift, label: 'نقاط الولاء', desc: 'اكسب واستبدل نقاطك' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 pb-28 pt-4">
        {/* Profile Card */}
        <div className="card p-6 mb-5 text-center">
          <div className="w-20 h-20 rounded-full gradient-burgundy flex items-center justify-center text-3xl font-black text-white mx-auto mb-4 shadow-burgundy-lg">
            {user.fullName[0]}
          </div>
          <h2 className="font-tajawal font-black text-xl text-gray-800">{user.fullName}</h2>
          <p className="text-gray-400 text-sm mt-1 flex items-center justify-center gap-1">
            <Phone className="w-3.5 h-3.5" /> {user.phone}
          </p>
          {!user.isPhoneVerified && (
            <Link href="/verify-otp" className="badge badge-warning text-xs mt-2 inline-block">
              ⚠️ الهاتف غير محقق
            </Link>
          )}

          {/* Loyalty Points */}
          {user.loyaltyPoints > 0 && (
            <div className="mt-4 bg-gold/10 rounded-2xl p-3 inline-flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <div className="text-left">
                <p className="font-black text-lg text-gold-dark">{user.loyaltyPoints}</p>
                <p className="text-xs text-gray-500">نقطة ولاء</p>
              </div>
            </div>
          )}

          <Link href="/profile/edit" className="btn-secondary text-sm px-5 py-2 mt-4 inline-block">
            تعديل الملف الشخصي
          </Link>
        </div>

        {/* Referral Code */}
        {user.referralCode && (
          <div className="card p-4 mb-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-burgundy/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-burgundy" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-sm">كود الإحالة الخاص بك</p>
              <p className="text-xl font-tajawal font-black text-burgundy tracking-wider">
                {user.referralCode}
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(user.referralCode!);
                alert('تم النسخ!');
              }}
              className="text-xs text-burgundy font-bold bg-burgundy/10 px-3 py-1.5 rounded-lg"
            >
              نسخ
            </button>
          </div>
        )}

        {/* Menu Items */}
        <div className="card divide-y divide-gray-50 mb-5">
          {menuItems.map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#7b1e3a]/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-burgundy" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-gray-300" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full card py-4 flex items-center justify-center gap-2 text-red-500 font-semibold hover:bg-red-50 transition-colors">
          <LogOut className="w-5 h-5" />
          تسجيل الخروج
        </button>
      </main>
      <BottomNav />
    </>
  );
}
