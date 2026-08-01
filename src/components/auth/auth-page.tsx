'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APP_NAME, AUTH_CONFIG } from '@/lib/config';
import { useI18n } from '@/lib/i18n';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useUserStore, type User } from '@/stores/user-store';

interface AuthResponse {
  user?: User;
  error?: string;
}

export function AuthPage() {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const setUser = useUserStore((state) => state.setUser);
  const isRTL = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const demoLoginStarted = useRef(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regTerms, setRegTerms] = useState(false);

  const completeLogin = useCallback(
    (user: User) => {
      setUser(user);
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      if (redirect?.startsWith('/') && !redirect.startsWith('//')) {
        window.location.assign(redirect);
        return;
      }
      nav.setView('home');
    },
    [nav, setUser],
  );

  const requestAuth = useCallback(
    async (endpoint: string, body: Record<string, unknown>) => {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as AuthResponse;
      if (!response.ok || !data.user) {
        throw new Error(data.error || t('authFailedConnect'));
      }
      completeLogin(data.user);
    },
    [completeLogin, t],
  );

  const handleDemoLogin = useCallback(
    async (role: 'buyer' | 'seller' = 'buyer') => {
      setIsLoading(true);
      setError('');
      try {
        await requestAuth('/api/auth/demo', { role });
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : t('authFailedConnect'),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [requestAuth, t],
  );

  useEffect(() => {
    const role = new URLSearchParams(window.location.search).get('demo');
    if ((role === 'buyer' || role === 'seller') && !demoLoginStarted.current) {
      demoLoginStarted.current = true;
      void handleDemoLogin(role);
    }
  }, [handleDemoLogin]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) {
      setError(t('authEnterValidEmail'));
      return;
    }
    if (!loginPassword) {
      setError(t('authEnterPassword'));
      return;
    }

    setIsLoading(true);
    try {
      await requestAuth('/api/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t('authFailedConnect'),
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!regName.trim()) {
      setError(t('authEnterName'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      setError(t('authEnterValidEmail'));
      return;
    }
    if (regPassword.length < Math.max(8, AUTH_CONFIG.minPasswordLength)) {
      setError(t('authPasswordMinLength', { min: 8 }));
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }
    if (!regTerms) {
      setError(t('authAgreeTerms'));
      return;
    }

    setIsLoading(true);
    try {
      await requestAuth('/api/auth/register', {
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t('authFailedConnect'),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/30 p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-1.5"
          onClick={() => nav.setView('home')}
        >
          <ArrowLeft
            className={`size-4 ${isRTL ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
          {t('back')}
        </Button>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white text-center rounded-t-xl">
              <h1 className="text-2xl font-bold">{APP_NAME}</h1>
              <p className="text-emerald-100 text-sm mt-1">
                {t('authTagline')}
              </p>
            </div>

            <div className="p-6">
              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  setActiveTab(value as 'login' | 'register');
                  setError('');
                }}
              >
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="login" className="flex-1">
                    {t('login')}
                  </TabsTrigger>
                  <TabsTrigger value="register" className="flex-1">
                    {t('signup')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form
                    onSubmit={handleLogin}
                    className="space-y-4"
                    aria-label={t('login')}
                    aria-busy={isLoading}
                  >
                    <Field
                      id="login-email"
                      label={t('email')}
                      icon={<Mail className="size-4" />}
                      isRTL={isRTL}
                    >
                      <Input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        value={loginEmail}
                        onChange={(event) => setLoginEmail(event.target.value)}
                        className={isRTL ? 'pr-10' : 'pl-10'}
                        required
                      />
                    </Field>

                    <Field
                      id="login-password"
                      label={t('password')}
                      icon={<Lock className="size-4" />}
                      isRTL={isRTL}
                    >
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(event) => setLoginPassword(event.target.value)}
                        className={isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}
                        required
                      />
                      <PasswordToggle
                        shown={showPassword}
                        isRTL={isRTL}
                        onClick={() => setShowPassword((value) => !value)}
                      />
                    </Field>

                    <AuthError message={error} />
                    <SubmitButton loading={isLoading} label={t('login')} />

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-xl border-emerald-300 text-emerald-700"
                        onClick={() => void handleDemoLogin('buyer')}
                        disabled={isLoading}
                      >
                        {isRTL ? 'تجربة حساب المشتري' : 'Buyer Demo'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-xl border-teal-300 text-teal-700"
                        onClick={() => void handleDemoLogin('seller')}
                        disabled={isLoading}
                      >
                        {isRTL ? 'تجربة حساب البائع' : 'Seller Demo'}
                      </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                      {t('dontHaveAccount')}{' '}
                      <Button
                        variant="link"
                        className="text-xs h-auto p-0 text-emerald-600"
                        type="button"
                        onClick={() => setActiveTab('register')}
                      >
                        {t('signup')}
                      </Button>
                    </p>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form
                    onSubmit={handleRegister}
                    className="space-y-4"
                    aria-label={t('signup')}
                    aria-busy={isLoading}
                  >
                    <Field
                      id="reg-name"
                      label={t('authFullName')}
                      icon={<UserIcon className="size-4" />}
                      isRTL={isRTL}
                    >
                      <Input
                        id="reg-name"
                        autoComplete="name"
                        value={regName}
                        onChange={(event) => setRegName(event.target.value)}
                        className={isRTL ? 'pr-10' : 'pl-10'}
                        required
                      />
                    </Field>

                    <Field
                      id="reg-email"
                      label={t('email')}
                      icon={<Mail className="size-4" />}
                      isRTL={isRTL}
                    >
                      <Input
                        id="reg-email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        value={regEmail}
                        onChange={(event) => setRegEmail(event.target.value)}
                        className={isRTL ? 'pr-10' : 'pl-10'}
                        required
                      />
                    </Field>

                    <Field
                      id="reg-phone"
                      label={`${t('phone')} (${t('authOptional')})`}
                      icon={<Phone className="size-4" />}
                      isRTL={isRTL}
                    >
                      <Input
                        id="reg-phone"
                        type="tel"
                        autoComplete="tel"
                        value={regPhone}
                        onChange={(event) => setRegPhone(event.target.value)}
                        className={isRTL ? 'pr-10' : 'pl-10'}
                      />
                    </Field>

                    <Field
                      id="reg-password"
                      label={t('password')}
                      icon={<Lock className="size-4" />}
                      isRTL={isRTL}
                    >
                      <Input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        minLength={8}
                        value={regPassword}
                        onChange={(event) => setRegPassword(event.target.value)}
                        className={isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}
                        required
                      />
                      <PasswordToggle
                        shown={showPassword}
                        isRTL={isRTL}
                        onClick={() => setShowPassword((value) => !value)}
                      />
                    </Field>

                    <Field
                      id="reg-confirm-password"
                      label={t('confirmPassword')}
                      icon={<Lock className="size-4" />}
                      isRTL={isRTL}
                    >
                      <Input
                        id="reg-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={regConfirmPassword}
                        onChange={(event) =>
                          setRegConfirmPassword(event.target.value)
                        }
                        className={isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}
                        required
                      />
                      <PasswordToggle
                        shown={showConfirmPassword}
                        isRTL={isRTL}
                        onClick={() =>
                          setShowConfirmPassword((value) => !value)
                        }
                      />
                    </Field>

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="terms"
                        checked={regTerms}
                        onCheckedChange={(checked) =>
                          setRegTerms(checked === true)
                        }
                      />
                      <Label
                        htmlFor="terms"
                        className="text-xs text-muted-foreground leading-tight"
                      >
                        {t('authIAgreeTo')} {t('termsOfService')} {t('authAnd')}{' '}
                        {t('privacyPolicy')}
                      </Label>
                    </div>

                    <AuthError message={error} />
                    <SubmitButton loading={isLoading} label={t('signup')} />

                    <p className="text-xs text-center text-muted-foreground">
                      {t('alreadyHaveAccount')}{' '}
                      <Button
                        variant="link"
                        className="text-xs h-auto p-0 text-emerald-600"
                        type="button"
                        onClick={() => setActiveTab('login')}
                      >
                        {t('login')}
                      </Button>
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  icon,
  isRTL,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  isRTL: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span
          className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground ${
            isRTL ? 'right-3' : 'left-3'
          }`}
          aria-hidden="true"
        >
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

function PasswordToggle({
  shown,
  isRTL,
  onClick,
}: {
  shown: boolean;
  isRTL: boolean;
  onClick: () => void;
}) {
  const label = shown
    ? isRTL
      ? 'إخفاء كلمة المرور'
      : 'Hide password'
    : isRTL
      ? 'إظهار كلمة المرور'
      : 'Show password';

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`absolute top-1/2 -translate-y-1/2 size-9 ${
        isRTL ? 'left-1' : 'right-1'
      }`}
      type="button"
      onClick={onClick}
      aria-label={label}
    >
      {shown ? (
        <EyeOff className="size-4" aria-hidden="true" />
      ) : (
        <Eye className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}

function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-red-600 text-center" role="alert">
      {message}
    </p>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <Button
      type="submit"
      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white h-11 rounded-xl"
      disabled={loading}
      aria-busy={loading}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin me-2" aria-hidden="true" />
      ) : null}
      {label}
    </Button>
  );
}
