import { useState, type ReactNode } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, spacing } from '@/theme/tokens';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface Props {
  title: string;
  children: ReactNode;
  initiallyOpen?: boolean;
}

export function Accordion({ title, children, initiallyOpen = false }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(initiallyOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((value) => !value);
  };

  return (
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={toggle}
        style={styles.header}>
        <AppText variant="heading" style={styles.title}>
          {title}
        </AppText>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size="sm" color={colors.textSecondary} />
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  header: { minHeight: minTouch + 8, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1 },
  body: { paddingBottom: spacing.md, gap: spacing.sm },
});
