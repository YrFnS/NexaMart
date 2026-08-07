import { AuthPage } from '@/components/auth/auth-page';

export default function AuthRoute() {
  return (
    <AuthPage demoLoginEnabled={process.env.ENABLE_DEMO_LOGIN === 'true'} />
  );
}
