'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, saveTokens } from '@/lib/api';

type Step = 'phone' | 'otp';
const OTP_LEN = 6;
const RESEND_CD = 60;

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep]         = useState<Step>('phone');
  const [phone, setPhone]       = useState('+963');
  const [otp, setOtp]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [countdown, setCountdown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isPhoneValid = /^\+963\d{9}$/.test(phone.replace(/\s/g, ''));

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!isPhoneValid) return;
    setLoading(true); setError('');
    try {
      await authApi.sendOtp(phone.replace(/\s/g, ''));
      setStep('otp');
      setCountdown(RESEND_CD);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'تعذّر إرسال الرمز');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== OTP_LEN) return;
    setLoading(true); setError('');
    try {
      const { data } = await authApi.verifyOtp(phone.replace(/\s/g, ''), otp);
      const { accessToken, refreshToken, user } = data.data;
      if (user.role !== 'admin') {
        setError('هذا الحساب ليس حساب مدير');
        return;
      }
      saveTokens(accessToken, refreshToken);
      router.replace('/dashboard');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'رمز غير صحيح');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at top, #0D1535 0%, #0A0E1A 60%)' }}
    >
      {/* Brand glow */}
      <div className="absolute top-0 inset-x-0 h-72 opacity-30"
        style={{ background: 'radial-gradient(ellipse at top, #4F46E5 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 glow-brand"
            style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
            🏟️
          </div>
          <h1 className="text-2xl font-bold text-[--text-primary]">يلا بلاي</h1>
          <p className="text-sm text-[--text-tertiary] mt-1">بوابة المشرف العام</p>
        </div>

        <div className="glass-card-strong p-6">
          {step === 'phone' ? (
            <>
              <h2 className="text-lg font-semibold text-[--text-primary] mb-1">تسجيل الدخول</h2>
              <p className="text-sm text-[--text-tertiary] mb-6">أدخل رقم هاتف حساب المشرف</p>

              <label className="block text-xs font-medium text-[--text-secondary] mb-1.5">رقم الهاتف</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v.startsWith('+963')) return;
                  setPhone(v.replace(/[^\d+]/g, ''));
                }}
                maxLength={13}
                placeholder="+963XXXXXXXXX"
                className="field-input text-lg font-semibold tracking-widest mb-4"
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                autoFocus
              />

              {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

              <button
                onClick={handleSendOtp}
                disabled={!isPhoneValid || loading}
                className="btn-brand w-full justify-center py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="text-sm text-[--text-secondary] hover:text-[--text-primary] mb-4 flex items-center gap-1"
              >
                ← رجوع
              </button>
              <h2 className="text-lg font-semibold text-[--text-primary] mb-1">رمز التحقق</h2>
              <p className="text-sm text-[--text-tertiary] mb-6">
                أُرسل رمز مكوّن من 6 أرقام إلى{' '}
                <span className="text-brand-primary font-semibold">{phone}</span>
              </p>

              {/* OTP boxes */}
              <div className="relative mb-6">
                <div className="flex gap-2 justify-center" onClick={() => inputRef.current?.focus()}>
                  {Array.from({ length: OTP_LEN }).map((_, i) => (
                    <div
                      key={i}
                      className={`
                        w-12 h-14 rounded-xl flex items-center justify-center text-xl font-bold
                        border transition-all duration-150 cursor-text select-none
                        ${otp[i] ? 'border-brand-primary bg-brand-primary/10 text-[--text-primary]'
                          : i === otp.length ? 'border-brand-primary shadow-[0_0_12px_rgba(79,70,229,0.4)] bg-white/5 text-[--text-primary]'
                          : 'border-white/15 bg-white/3 text-transparent'}
                      `}
                    >
                      {otp[i] ?? ''}
                    </div>
                  ))}
                </div>
                <input
                  ref={inputRef}
                  value={otp}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, OTP_LEN);
                    setOtp(v);
                    if (v.length === OTP_LEN) {
                      // auto-submit
                      setTimeout(() => handleVerify(), 0);
                    }
                  }}
                  className="absolute opacity-0 inset-0 w-full cursor-text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>

              {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}

              <button
                onClick={handleVerify}
                disabled={otp.length < OTP_LEN || loading}
                className="btn-brand w-full justify-center py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed mb-3"
              >
                {loading ? 'جاري التحقق...' : 'تأكيد'}
              </button>

              <button
                onClick={handleSendOtp}
                disabled={countdown > 0 || loading}
                className="w-full text-center text-sm text-[--text-tertiary] disabled:cursor-not-allowed hover:text-[--text-secondary] transition-colors"
              >
                {countdown > 0 ? `إعادة الإرسال بعد ${countdown}ث` : 'إعادة إرسال الرمز'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
