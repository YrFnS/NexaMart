'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Key, LogIn, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setAdminKey, hasAdminKey, removeAdminKey, adminFetch } from '@/lib/admin-api';

export function AdminLoginGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [mounted, setMounted] = useState(false);

  const verifyKey = React.useCallback(async (customKey?: string) => {
    setVerifying(true);
    setError('');
    try {
      // If a custom key is provided, temporarily set it for the test
      if (customKey) {
        setAdminKey(customKey);
      }
      const res = await adminFetch('/api/admin/dashboard');
      if (res.ok || res.status === 200) {
        setIsAuthenticated(true);
      } else if (res.status === 401 || res.status === 403) {
        // Key is invalid — remove it
        removeAdminKey();
        setIsAuthenticated(false);
        setError('Invalid admin key. Please try again.');
      } else {
        // Other errors (500, etc.) — still allow access, the API may be down
        setIsAuthenticated(true);
      }
    } catch {
      // Network error — still allow access, may be offline
      setIsAuthenticated(true);
    }
    setVerifying(false);
  }, []);

  // Check localStorage on mount — eslint-disable for setMounted in effect
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (hasAdminKey()) {
      // Verify the stored key is still valid by making a test request
      verifyKey();
    }
  }, [verifyKey]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setError('Please enter an admin key.');
      return;
    }
    await verifyKey(key.trim());
  };

  const handleLogout = () => {
    removeAdminKey();
    setIsAuthenticated(false);
    setKey('');
  };

  // Avoid hydration mismatch — don't render until mounted
  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Logout button in top-right */}
        <div className="flex justify-end p-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-rose-600"
            onClick={handleLogout}
          >
            <Key className="h-3.5 w-3.5 me-1" />
            Logout
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-teal-50 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-emerald-200 dark:border-emerald-800">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="flex items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-xl font-bold">NexaMart Admin</CardTitle>
          </div>
          <CardDescription className="text-sm">
            Enter your admin secret key to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-key" className="text-xs font-medium">
                Admin Secret Key
              </Label>
              <div className="relative">
                <Key className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-key"
                  type="password"
                  placeholder="Enter admin key..."
                  value={key}
                  onChange={(e) => {
                    setKey(e.target.value);
                    setError('');
                  }}
                  className="ps-9 h-11 rounded-xl"
                  autoFocus
                  disabled={verifying}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="text-xs text-rose-700 dark:text-rose-300">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={verifying || !key.trim()}
            >
              {verifying ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Access Admin Panel
                </div>
              )}
            </Button>

            <p className="text-[11px] text-muted-foreground text-center mt-2">
              Your key is stored locally in this browser and sent with every admin API request.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
