'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { APP_NAME } from '@/lib/config';
import { useI18n } from '@/lib/i18n';
import { useUserStore } from '@/stores/user-store';

interface AuthResponse {
  user?: unknown;
  error?: string;
}

export function SecureAuthPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refreshSession = useUserStore(state => state.refreshSession);
  const isRTL = locale === 'ar';
  const demoStarted = useRef(false);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState('');

  const finishAuthentication = useCallback(async () => {
    await refreshSession();
    const next = searchParams.get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      router.replace(next);
    } else {
      router.replace('/');
    }
    router.refresh();
  }, [refreshSession, router, searchParams]);

  const submit = async (endpoint: string, body: Record<string, unknown>, action: string) => {
    setLoadingAction(action);
    setError('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => ({}))) as AuthResponse;
      if (!response.ok) {
        setError(data.error || t('authFailedConnect'));
        return;
      }
      await finishAuthentication();
    } catch {
      setError(t('authFailedConnect'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError(t('authEnterPassword'));
      return;
    }
    await submit('/api/auth/login', { email, password }, 'login');
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(t('authEnterName'));
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }
    if (!acceptedTerms) {
      setError(t('authAgreeTerms'));
      return;
    }
    await submit('/api/auth/register', { name, email, phone, password }, 'register');
  };

  const handleDemoLogin = useCallback(
    async (role: 'buyer' | 'seller') => {
      await submit('/api/auth/demo', { role }, `demo-${role}`);
    },
    // submit intentionally uses the current form/navigation state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [finishAuthentication, t],
  );

  useEffect(() => {
    const role = searchParams.get('demo');
    if ((role === 'buyer' || role === 'seller') && !demoStarted.current) {
      demoStarted.current = true;
      void handleDemoLogin(role);
    }
  }, [handleDemoLogin, searchParams]);

  const isBusy = loadingAction !== null;

  return (
    <div
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/30 p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md">
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={() => router.push('/')}>
          <ArrowLeft className={`size-4 ${isRTL ? 'rotate-180' : ''}`} />
          {t('back')}
        </Button>

        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white text-center">
            <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-white/15">
              <ShieldCheck className="size-6" />
            </div>
            <h1 className="text-2xl font-bold">{APP_NAME}</h1>
            <p className="text-emerald-100 text-sm mt-1">{t('authTagline')}</p>
          </div>

          <CardContent className="p-6">
            <div className="grid grid-cols-2 rounded-xl bg-muted p-1 mb-6">
              <Button
                type="button"
                variant={mode === 'login' ? 'secondary' : 'ghost'}
                className="rounded-lg"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
              >
                {t('login')}
              </Button>
              <Button
                type="button"
                variant={mode === 'register' ? 'secondary' : 'ghost'}
                className="rounded-lg"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
              >
                {t('signup')}
              </Button>
            </div>

            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
              {mode === 'register' && (
                <>
                  <Field icon={User} label={t('authFullName')} htmlFor="auth-name">
                    <Input
                      id="auth-name"
                      value={name}
                      onChange={event => setName(event.target.value)}
                      autoComplete="name"
                      maxLength={80}
                      required
                      className="ps-10"
                    />
                  </Field>
                  <Field icon={Phone} label={`${t('phone')} (${t('authOptional')})`} htmlFor="auth-phone">
                    <Input
                      id="auth-phone"
                      type="tel"
                      value={phone}
                      onChange={event => setPhone(event.target.value)}
                      autoComplete="tel"
                      maxLength={30}
                      className="ps-10"
                    />
                  </Field>
                </>
              )}

              <Field icon={Mail} label={t('email')} htmlFor="auth-email">
                <Input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  autoComplete="email"
                  maxLength={254}
                  required
                  className="ps-10"
                  placeholder="name@example.com"
                />
              </Field>

              <Field icon={Lock} label={t('password')} htmlFor="auth-password">
                <Input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={mode === 'register' ? 8 : undefined}
                  maxLength={128}
                  required
                  className="ps-10 pe-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-1 top-1/2 size-8 -translate-y-1/2"
                  onClick={() => setShowPassword(value => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </Field>

              {mode === 'register' && (
                <>
                  <Field icon={Lock} label={t('confirmPassword')} htmlFor="auth-confirm-password">
                    <Input
                      id="auth-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={event => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      required
                      className="ps-10"
                    />
                  </Field>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="auth-terms"
                      checked={acceptedTerms}
                      onCheckedChange={value => setAcceptedTerms(value === true)}
                    />
                    <Label htmlFor="auth-terms" className="text-xs leading-5 text-muted-foreground">
                      {t('authIAgreeTo')} {t('termsOfService')} {t('authAnd')} {t('privacyPolicy')}
                    </Label>
                  </div>
                </>
              )}

              {error && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90"
                disabled={isBusy}
              >
                {loadingAction === mode && <Loader2 className="size-4 animate-spin me-2" />}
                {mode === 'login' ? t('login') : t('signup')}
              </Button>
            </form>

            <div className="mt-6 border-t pt-5">
              <p className="mb-3 text-center text-xs text-muted-foreground">Secure demo accounts</p>
              <div className="grid grid-cols-2 gap-3">
                {(['buyer', 'seller'] as const).map(role => (
                  <Button
                    key={role}
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    disabled={isBusy}
                    onClick={() => void handleDemoLogin(role)}
                  >
                    {loadingAction === `demo-${role}` && <Loader2 className="size-4 animate-spin me-2" />}
                    {role === 'buyer' ? 'Buyer Demo' : 'Seller Demo'}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  htmlFor,
  children,
}: {
  icon: React.ElementType;
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="relative">
        <Icon className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
    </div>
  );
}
