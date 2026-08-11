import { AuthPage } from '@/components/auth/auth-page';
import { isDemoLoginEnabled } from '@/lib/demo-login';

export default function AuthRoute() {
  return <AuthPage demoLoginEnabled={isDemoLoginEnabled()} />;
}
