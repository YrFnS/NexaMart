'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, LogIn, LogOut, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/stores/user-store';

export function AdminLoginGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useUserStore(state => state.user);
  const hydrated = useUserStore(state => state.hydrated);
  const isHydrating = useUserStore(state => state.isHydrating);
  const refreshSession = useUserStore(state => state.refreshSession);
  const logout = useUserStore(state => state.logout);

  useEffect(() => {
    if (!hydrated) void refreshSession();
  }, [hydrated, refreshSession]);

  if (!hydrated || isHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Verifying admin session...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <GateCard
        title="Admin sign-in required"
        description="Sign in with an administrator account to continue. Shared browser keys are no longer accepted."
        actionLabel="Go to secure sign-in"
        onAction={() => router.push('/auth?next=/admin')}
      />
    );
  }

  if (user.role !== 'admin') {
    return (
      <GateCard
        title="Administrator access required"
        description={`The signed-in account ${user.email} does not have the admin role.`}
        actionLabel="Sign in with another account"
        destructive
        onAction={async () => {
          await logout();
          router.push('/auth?next=/admin');
        }}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex items-center justify-end gap-3 border-b px-3 py-2 text-xs text-muted-foreground">
        <span>{user.email}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs hover:text-rose-600"
          onClick={async () => {
            await logout();
            router.replace('/auth?next=/admin');
          }}
        >
          <LogOut className="size-3.5 me-1" />
          Logout
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

function GateCard({
  title,
  description,
  actionLabel,
  onAction,
  destructive = false,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void | Promise<void>;
  destructive?: boolean;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-teal-50 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-emerald-200 dark:border-emerald-800">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
            {destructive ? <AlertCircle className="size-6" /> : <Shield className="size-6" />}
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => void onAction()}
          >
            <LogIn className="size-4 me-2" />
            {actionLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
