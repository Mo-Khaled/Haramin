import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import type { ProductDetail, ProductVariant } from '@/lib/shopify/types';
import { spacing } from '@/theme/tokens';

export type Selection = Record<string, string>;

export function initialSelection(product: ProductDetail): Selection {
  const first = product.variants.find((v) => v.availableForSale) ?? product.variants[0];
  return Object.fromEntries((first?.selectedOptions ?? []).map((o) => [o.name, o.value]));
}

export function findVariant(product: ProductDetail, selection: Selection): ProductVariant | undefined {
  return product.variants.find((v) => v.selectedOptions.every((o) => selection[o.name] === o.value));
}

function optionAvailable(product: ProductDetail, selection: Selection, name: string, value: string): boolean {
  const candidate = { ...selection, [name]: value };
  return product.variants.some(
    (v) => v.availableForSale && v.selectedOptions.every((o) => candidate[o.name] === o.value),
  );
}

interface Props {
  product: ProductDetail;
  selection: Selection;
  onChange: (selection: Selection) => void;
}

export function VariantPicker({ product, selection, onChange }: Props) {
  const { t } = useTranslation();
  if (product.options.length === 0) return null;
  return (
    <View style={styles.wrap}>
      {product.options.map((option) => (
        <View key={option.name} style={styles.group}>
          <AppText variant="label" muted>
            {t('product.selectOption', { name: option.name })}
          </AppText>
          <View style={styles.chips}>
            {option.values.map((value) => (
              <Chip
                key={value}
                label={value}
                selected={selection[option.name] === value}
                disabled={!optionAvailable(product, selection, option.name, value)}
                onPress={() => onChange({ ...selection, [option.name]: value })}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  group: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
