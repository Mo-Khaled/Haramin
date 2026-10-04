import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Sheet } from '@/components/ui/Sheet';
import { formatMoney } from '@/lib/format';
import type { ProductFilter, SortKey } from '@/lib/shopify/types';
import { spacing } from '@/theme/tokens';

export interface ActiveFilters {
  inStock: boolean;
  priceBand: PriceBand | null;
}

export interface PriceBand {
  min: number;
  max: number | null;
}

export const NO_FILTERS: ActiveFilters = { inStock: false, priceBand: null };

const PRICE_BANDS: PriceBand[] = [
  { min: 0, max: 500 },
  { min: 500, max: 1000 },
  { min: 1000, max: 2000 },
  { min: 2000, max: null },
];

/** Converts UI filter state to the JSON inputs the Storefront API expects. */
export function toFilterInputs(filters: ActiveFilters): string[] {
  const inputs: string[] = [];
  if (filters.inStock) inputs.push(JSON.stringify({ available: true }));
  if (filters.priceBand) {
    const { min, max } = filters.priceBand;
    inputs.push(JSON.stringify({ price: max === null ? { min } : { min, max } }));
  }
  return inputs;
}

export function countActive(filters: ActiveFilters): number {
  return Number(filters.inStock) + Number(filters.priceBand !== null);
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'FEATURED', label: 'collection.sortFeatured' },
  { key: 'BEST_SELLING', label: 'collection.sortBest' },
  { key: 'NEWEST', label: 'collection.sortNewest' },
  { key: 'PRICE_ASC', label: 'collection.sortPriceAsc' },
  { key: 'PRICE_DESC', label: 'collection.sortPriceDesc' },
];

export function SortSheet({
  visible,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  value: SortKey;
  onSelect: (key: SortKey) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Sheet visible={visible} title={t('collection.sort')} onClose={onClose}>
      <View style={styles.wrap}>
        {SORT_OPTIONS.map((option) => (
          <Chip
            key={option.key}
            label={t(option.label)}
            selected={value === option.key}
            onPress={() => {
              onSelect(option.key);
              onClose();
            }}
          />
        ))}
      </View>
    </Sheet>
  );
}

export function FilterSheet({
  visible,
  filters,
  available,
  onChange,
  onClose,
}: {
  visible: boolean;
  filters: ActiveFilters;
  available: ProductFilter[];
  onChange: (filters: ActiveFilters) => void;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const hasAvailability = available.some((f) => f.id === 'filter.v.availability');
  const hasPrice = available.some((f) => f.id === 'filter.v.price');

  return (
    <Sheet
      visible={visible}
      title={t('collection.filter')}
      onClose={onClose}
      footer={
        <>
          <Button label={t('collection.showResults')} onPress={onClose} />
          <Button label={t('collection.clear')} variant="secondary" onPress={() => onChange(NO_FILTERS)} />
        </>
      }>
      {hasAvailability ? (
        <View style={styles.group}>
          <AppText variant="label" muted>
            {t('collection.availability')}
          </AppText>
          <View style={styles.wrap}>
            <Chip
              label={t('collection.inStock')}
              selected={filters.inStock}
              onPress={() => onChange({ ...filters, inStock: !filters.inStock })}
            />
          </View>
        </View>
      ) : null}
      {hasPrice ? (
        <View style={styles.group}>
          <AppText variant="label" muted>
            {t('collection.price')}
          </AppText>
          <View style={styles.wrap}>
            {PRICE_BANDS.map((band) => {
              const selected = filters.priceBand?.min === band.min && filters.priceBand?.max === band.max;
              const label =
                band.max === null
                  ? `${formatMoney(band.min, i18n.language)}+`
                  : `${formatMoney(band.min, i18n.language)} – ${formatMoney(band.max, i18n.language)}`;
              return (
                <Chip
                  key={band.min}
                  label={label}
                  selected={selected}
                  onPress={() => onChange({ ...filters, priceBand: selected ? null : band })}
                />
              );
            })}
          </View>
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
