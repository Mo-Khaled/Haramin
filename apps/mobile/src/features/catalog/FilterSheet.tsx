import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Sheet } from '@/components/ui/Sheet';
import { formatMoney } from '@/lib/format';
import type { ProductFilter, SortKey } from '@/lib/shopify/types';
import { NO_FILTERS, PRICE_BANDS, type ActiveFilters } from './filterInputs';
import { spacing } from '@/theme/tokens';

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
