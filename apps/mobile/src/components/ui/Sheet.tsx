import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from './AppText';
import { IconButton } from './IconButton';
import { useDirectionStyle } from '@/lib/direction';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Sheet({ visible, title, onClose, children, footer }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const direction = useDirectionStyle();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={[styles.scrim, { backgroundColor: colors.overlay }]}
        onPress={onClose}
        accessibilityLabel={t('common.close')}
      />
      <View style={[styles.sheet, direction, { backgroundColor: colors.background, paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.header}>
          <AppText variant="heading" style={styles.title} accessibilityRole="header">
            {title}
          </AppText>
          <IconButton name="close" label={t('common.close')} onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={styles.body}>{children}</ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1 },
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: '85%' },
  header: { flexDirection: 'row', alignItems: 'center', paddingStart: spacing.md, paddingEnd: spacing.sm },
  title: { flex: 1 },
  body: { padding: spacing.md, gap: spacing.md },
  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.sm },
});
