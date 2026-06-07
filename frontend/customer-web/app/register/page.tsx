'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Phone, Lock, Eye, EyeOff, Gift, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services';
import { normalizePhone } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { setTokensAndUser } = useAuthStore();

  const [form, setForm] = useState({
    fullName: '', phone: '', password: '', confirmPassword: '', referralCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [registeredData, setRegisteredData] = useState<{ accessToken: string; refreshToken: string; user: any } | null>(null);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('كلمة المرور غير متطابقة'); return;
    }
    if (form.password.length < 8) {
      toast.error('كلمة المرور لا تقل عن 8 أحرف'); return;
    }

    setLoading(true);
    try {
      const res = await authService.register({
        fullName: form.fullName.trim(),
        phone: normalizePhone(form.phone),
        password: form.password,
        referralCode: form.referralCode || undefined,
      });

      if (res.success && res.data) {
        setRegisteredData(res.data);
        // Send OTP
        await authService.sendOtp(normalizePhone(form.phone));
        toast.success('تم التسجيل! أرسلنا كود تحقق لهاتفك');
        setStep('verify');
      } else {
        toast.error(res.errors?.[0] ?? 'حدث خطأ في التسجيل');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.errors?.[0] ?? 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('الكود يجب أن يكون 6 أرقام'); return; }

    setOtpLoading(true);
    try {
      const res = await authService.verifyOtp(normalizePhone(form.phone), otp);
      if (res.success) {
        if (registeredData) {
          setTokensAndUser(registeredData.accessToken, registeredData.refreshToken, registeredData.user);
        }
        toast.success(`أهلاً بك ${form.fullName.split(' ')[0]} 🎉`);
        router.push('/');
      } else {
        toast.error(res.errors?.[0] ?? 'الكود غير صحيح');
      }
    } catch {
      toast.error('حدث خطأ، حاول مرة أخرى');
    } finally {
      setOtpLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      await authService.sendOtp(normalizePhone(form.phone));
      toast.success('تم إعادة إرسال الكود');
    } catch {
      toast.error('حدث خطأ في الإرسال');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-12 h-12 rounded-2xl gradient-burgundy flex items-center justify-center text-2xl shadow-burgundy-lg">🍽️</div>
        <span className="font-tajawal font-black text-3xl text-burgundy">سُفرة واحدة</span>
      </Link>

      <div className="card w-full max-w-md p-8 shadow-burgundy-lg">
        {step === 'register' ? (
          <>
            <h1 className="font-tajawal font-black text-2xl text-gray-800 mb-1">إنشاء حساب جديد</h1>
            <p className="text-gray-400 text-sm mb-6">سجّل مجاناً واطلب أكلك المفضل</p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={form.fullName} onChange={(e) => update('fullName', e.target.value)}
                    placeholder="محمد أحمد" className="input-field pr-10" required minLength={3} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)}
                    placeholder="01xxxxxxxxx" className="input-field pr-10" dir="ltr" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="8 أحرف على الأقل" className="input-field pr-10 pl-10" required minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">تأكيد كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="password" value={form.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                    placeholder="أعد إدخال كلمة المرور" className="input-field pr-10" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  كود الإحالة <span className="text-gray-400 font-normal">(اختياري)</span>
                </label>
                <div className="relative">
                  <Gift className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={form.referralCode}
                    onChange={(e) => update('referralCode', e.target.value.toUpperCase())}
                    placeholder="كود صديق" className="input-field pr-10" maxLength={10} dir="ltr" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    جاري التسجيل...
                  </span>
                ) : (<>إنشاء الحساب <ArrowRight className="w-4 h-4" /></>)}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              عندك حساب؟{' '}
              <Link href="/login" className="text-burgundy font-bold">سجّل دخول</Link>
            </p>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-burgundy/10 flex items-center justify-center mx-auto mb-4 text-3xl">📱</div>
              <h1 className="font-tajawal font-black text-2xl text-gray-800 mb-1">تحقق من هاتفك</h1>
              <p className="text-gray-400 text-sm">
                أرسلنا كود تحقق لـ <span className="font-bold text-gray-700">{form.phone}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">كود التحقق (6 أرقام)</label>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="------" className="input-field text-center text-2xl font-mono tracking-widest"
                  dir="ltr" maxLength={6} required />
              </div>

              <button type="submit" disabled={otpLoading || otp.length !== 6}
                className="btn-primary w-full py-3.5 text-base">
                {otpLoading ? 'جاري التحقق...' : 'تأكيد الكود ✅'}
              </button>

              <button type="button" onClick={resendOtp}
                className="w-full text-sm text-gray-500 hover:text-burgundy transition-colors py-2">
                لم يصلك الكود؟ <span className="font-bold text-burgundy">أعد الإرسال</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
