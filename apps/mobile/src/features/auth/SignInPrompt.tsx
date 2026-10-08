import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/States';
import { useAuth } from './AuthProvider';
import { reportFailure } from '@/lib/sentry';

/** Shown on account-only screens to guests: explains why and offers sign-in when it is configured. */
export function SignInPrompt({ message }: { message: string }) {
  const { t } = useTranslation();
  const auth = useAuth();
  return (
    <EmptyState
      message={message}
      actionLabel={auth.configured ? t('account.signIn') : undefined}
      onAction={auth.configured ? () => auth.signIn().catch(reportFailure) : undefined}
    />
  );
}
