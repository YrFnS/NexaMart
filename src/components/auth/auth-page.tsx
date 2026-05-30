'use client';

import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useUserStore } from '@/stores/user-store';
import { AUTH_CONFIG, APP_NAME } from '@/lib/config';

export function AuthPage() {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const { setUser } = useUserStore();
  const isRTL = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regTerms, setRegTerms] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/demo');
      const data = await res.json();
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          phone: data.user.phone || undefined,
          avatar: data.user.avatar || undefined,
          role: data.user.role || 'buyer',
          loyaltyTier: 'Gold',
          loyaltyPoints: 1250,
          walletBalance: 150.00,
          aiCredits: 25,
          isVerified: true,
        });
        nav.setView('home');
      } else {
        setError(data.error || 'Demo login failed');
      }
    } catch {
      setError(t('authFailedConnect'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(loginEmail)) {
      setError(t('authEnterValidEmail'));
      return;
    }
    if (!loginPassword) {
      setError(t('authEnterPassword'));
      return;
    }

    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setUser({
        ...AUTH_CONFIG.defaultNewUser,
        id: 'user-1',
        email: loginEmail,
        name: loginEmail.split('@')[0],
      });
      nav.setView('home');
      setIsLoading(false);
    }, 1500);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regName.trim()) {
      setError(t('authEnterName'));
      return;
    }
    if (!validateEmail(regEmail)) {
      setError(t('authEnterValidEmail'));
      return;
    }
    if (regPassword.length < AUTH_CONFIG.minPasswordLength) {
      setError(t('authPasswordMinLength', { min: AUTH_CONFIG.minPasswordLength }));
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
    setTimeout(() => {
      setUser({
        ...AUTH_CONFIG.defaultNewUser,
        id: 'user-new',
        email: regEmail,
        name: regName,
        phone: regPhone || undefined,
        loyaltyTier: 'Bronze',
        loyaltyPoints: 100,
        aiCredits: 5,
      });
      nav.setView('home');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/30 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={() => nav.setView('home')}>
          <ArrowLeft className={`size-4 ${isRTL ? 'rotate-180' : ''}`} />
          {t('back')}
        </Button>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-0">
            {/* Header Gradient */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white text-center rounded-t-xl">
              <h1 className="text-2xl font-bold">{APP_NAME}</h1>
              <p className="text-emerald-100 text-sm mt-1">
                {t('authTagline')}
              </p>
            </div>

            <div className="p-6">
              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'login' | 'register'); setError(''); }}>
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="login" className="flex-1">{t('login')}</TabsTrigger>
                  <TabsTrigger value="register" className="flex-1">{t('signup')}</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">{t('email')}</Label>
                      <div className="relative">
                        <Mail className={`absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="name@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">{t('password')}</Label>
                        <Button variant="link" className="text-xs h-auto p-0 text-emerald-600" type="button">
                          {t('forgotPassword')}
                        </Button>
                      </div>
                      <div className="relative">
                        <Lock className={`absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className={isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`absolute top-1/2 -translate-y-1/2 size-8 ${isRTL ? 'left-1' : 'right-1'}`}
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </Button>
                      </div>
                    </div>

                    {error && (
                      <p className="text-sm text-red-500 text-center">{error}</p>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white h-11 rounded-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="size-4 animate-spin me-2" /> : null}
                      {t('login')}
                    </Button>

                    {/* Divider */}
                    <div className="relative">
                      <Separator />
                      <span className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-card px-3 text-xs text-muted-foreground">
                        {t('orContinueWith')}
                      </span>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" type="button" className="h-10 rounded-xl gap-2">
                        <svg className="size-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Google
                      </Button>
                      <Button variant="outline" type="button" className="h-10 rounded-xl gap-2">
                        <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                        Apple
                      </Button>
                    </div>

                    {/* Demo Login */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10 rounded-xl border-emerald-300 dark:border-emerald-700 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-2"
                      onClick={handleDemoLogin}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                      {t('quickDemoLogin')}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      {t('dontHaveAccount')}{' '}
                      <Button variant="link" className="text-xs h-auto p-0 text-emerald-600" type="button" onClick={() => setActiveTab('register')}>
                        {t('signup')}
                      </Button>
                    </p>
                  </form>
                </TabsContent>

                {/* Register Tab */}
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">{t('authFullName')}</Label>
                      <div className="relative">
                        <User className={`absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="reg-name"
                          type="text"
                          placeholder={t('authNamePlaceholder')}
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-email">{t('email')}</Label>
                      <div className="relative">
                        <Mail className={`absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="name@example.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-phone">{t('phone')} ({t('authOptional')})</Label>
                      <div className="relative">
                        <Phone className={`absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="reg-phone"
                          type="tel"
                          placeholder="+966 5xx xxx xxx"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-password">{t('password')}</Label>
                      <div className="relative">
                        <Lock className={`absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className={isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`absolute top-1/2 -translate-y-1/2 size-8 ${isRTL ? 'left-1' : 'right-1'}`}
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-confirm-password">{t('confirmPassword')}</Label>
                      <div className="relative">
                        <Lock className={`absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="reg-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          className={isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`absolute top-1/2 -translate-y-1/2 size-8 ${isRTL ? 'left-1' : 'right-1'}`}
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="terms"
                        checked={regTerms}
                        onCheckedChange={(c) => setRegTerms(c === true)}
                      />
                      <Label htmlFor="terms" className="text-xs text-muted-foreground leading-tight">
                        {t('authIAgreeTo')}{' '}
                        <span className="text-emerald-600 cursor-pointer">{t('termsOfService')}</span>{' '}
                        {t('authAnd')}{' '}
                        <span className="text-emerald-600 cursor-pointer">{t('privacyPolicy')}</span>
                      </Label>
                    </div>

                    {error && (
                      <p className="text-sm text-red-500 text-center">{error}</p>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white h-11 rounded-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="size-4 animate-spin me-2" /> : null}
                      {t('signup')}
                    </Button>

                    {/* Divider */}
                    <div className="relative">
                      <Separator />
                      <span className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-card px-3 text-xs text-muted-foreground">
                        {t('orContinueWith')}
                      </span>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" type="button" className="h-10 rounded-xl gap-2">
                        <svg className="size-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Google
                      </Button>
                      <Button variant="outline" type="button" className="h-10 rounded-xl gap-2">
                        <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                        Apple
                      </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                      {t('alreadyHaveAccount')}{' '}
                      <Button variant="link" className="text-xs h-auto p-0 text-emerald-600" type="button" onClick={() => setActiveTab('login')}>
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
