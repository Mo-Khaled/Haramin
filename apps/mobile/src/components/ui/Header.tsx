import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { spacing } from '@/theme/tokens';
import { AppText } from './AppText';
import { IconButton } from './IconButton';
import { useIsRTL } from '@/lib/direction';

interface Props {
  title?: string;
  right?: ReactNode;
  showBack?: boolean;
}

export function Header({ title, right, showBack = true }: Props) {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {showBack ? (
          <IconButton
            name={isRTL ? 'chevron-forward' : 'chevron-back'}
            label={t('common.back')}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
        ) : null}
      </View>
      <AppText variant="heading" numberOfLines={1} style={styles.title} accessibilityRole="header">
        {title}
      </AppText>
      <View style={[styles.side, styles.sideEnd]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, minHeight: 56 },
  side: { width: 96, flexDirection: 'row', alignItems: 'center' },
  sideEnd: { justifyContent: 'flex-end' },
  title: { flex: 1, textAlign: 'center' },
});
