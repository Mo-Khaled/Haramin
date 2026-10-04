import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatMoney } from '@/lib/format';
import type { Money } from '@/lib/shopify/types';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

interface Props {
  price: Money;
  compareAt?: Money | null;
  large?: boolean;
}

export function Price({ price, compareAt, large }: Props) {
  const { i18n } = useTranslation();
  const { colors } = useTheme();
  const variant = large ? 'heading' : 'label';
  return (
    <View style={styles.row}>
      <AppText variant={variant} color={compareAt ? colors.danger : colors.text}>
        {formatMoney(price.amount, i18n.language, price.currencyCode)}
      </AppText>
      {compareAt ? (
        <AppText variant="caption" muted style={styles.strike}>
          {formatMoney(compareAt.amount, i18n.language, compareAt.currencyCode)}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  strike: { textDecorationLine: 'line-through' },
});
