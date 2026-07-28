'use client';

import React from 'react';
import { AlertCircle, LogIn, LogOut, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/stores/user-store';

export function AdminLoginGate({ children }: { children: React.ReactNode }) {
  const user = useUserStore((state) => state.user);
  const isHydrated = useUserStore((state) => state.isHydrated);
  const logout = useUserStore((state) => state.logout);

  if (!isHydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user?.role === 'admin') {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="flex justify-end p-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-rose-600"
            onClick={() => {
              void logout().then(() => window.location.assign('/'));
            }}
          >
            <LogOut className="h-3.5 w-3.5 me-1" />
            Logout
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">{children}</div>
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
            Sign in with an administrator account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs text-amber-700 dark:text-amber-300">
                The signed-in account does not have administrator access.
              </span>
            </div>
          )}
          <Button
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => window.location.assign('/auth?redirect=/admin')}
          >
            <LogIn className="h-4 w-4 me-2" />
            Sign in as administrator
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            Admin secrets are no longer stored in this browser.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
