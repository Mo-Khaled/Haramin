import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTracking } from '@/lib/direction';
import { useTheme } from '@/theme/ThemeProvider';

/** Centered wine heading used by the image-led home sections (NEW IN, BRANDS). */
export function SectionHeading({ title }: { title: string }) {
  const { colors } = useTheme();
  const tracking = useTracking(0.5);
  return (
    <AppText variant="title" color={colors.primaryText} accessibilityRole="header" style={[styles.heading, { letterSpacing: tracking }]}>
      {title}
    </AppText>
  );
}

const styles = StyleSheet.create({
  heading: { textAlign: 'center', textTransform: 'uppercase' },
});
