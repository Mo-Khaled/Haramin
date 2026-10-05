import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { AppText } from './AppText';
import { Button } from './Button';

export function LoadingState() {
  const { colors } = useTheme();
  return (
    <View style={styles.center} accessibilityRole="progressbar">
      <ActivityIndicator color={colors.primaryText} size="large" />
    </View>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.center}>
      <AppText variant="heading" style={styles.text}>
        {t('common.error')}
      </AppText>
      {onRetry ? <Button label={t('common.retry')} onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

interface EmptyProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ message, actionLabel, onAction }: EmptyProps) {
  return (
    <View style={styles.center}>
      <AppText variant="heading" muted style={styles.text}>
        {message}
      </AppText>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  text: { textAlign: 'center' },
});
