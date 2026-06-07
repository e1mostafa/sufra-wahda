'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Phone, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services';
import { normalizePhone } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const { setTokensAndUser } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) { toast.error('يرجى إدخال جميع البيانات'); return; }

    setLoading(true);
    try {
      const res = await authService.login(normalizePhone(phone), password);
      if (res.success && res.data) {
        setTokensAndUser(res.data.accessToken, res.data.refreshToken, res.data.user);
        toast.success(`أهلاً ${res.data.user.fullName} 👋`);
        router.push(redirect);
      } else {
        toast.error(res.errors?.[0] ?? 'بيانات خاطئة');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.errors?.[0] ?? 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-12 h-12 rounded-2xl gradient-burgundy flex items-center justify-center text-2xl shadow-burgundy-lg">
          🍽️
        </div>
        <span className="font-tajawal font-black text-3xl text-burgundy">سُفرة واحدة</span>
      </Link>

      <div className="card w-full max-w-md p-8 shadow-burgundy-lg">
        <h1 className="font-tajawal font-black text-2xl text-gray-800 mb-1">تسجيل الدخول</h1>
        <p className="text-gray-400 text-sm mb-6">أهلاً بعودتك! اطلب أكلك المفضل</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              رقم الهاتف
            </label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="input-field pr-10"
                dir="ltr"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pr-10 pl-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Link href="/forgot-password" className="block text-left text-sm text-burgundy font-semibold">
            نسيت كلمة المرور؟
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                جاري تسجيل الدخول...
              </span>
            ) : (
              <>
                تسجيل الدخول
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          مش عندك حساب؟{' '}
          <Link href="/register" className="text-burgundy font-bold">
            سجّل الآن مجاناً
          </Link>
        </p>
      </div>
    </div>
  );
}
