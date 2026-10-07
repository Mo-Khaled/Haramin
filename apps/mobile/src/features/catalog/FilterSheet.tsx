import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Accordion } from '@/components/ui/Accordion';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { Sheet } from '@/components/ui/Sheet';
import { formatMoney } from '@/lib/format';
import type { FilterValue, ProductFilter, SortKey } from '@/lib/shopify/types';
import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, spacing } from '@/theme/tokens';
import { isSelected, NO_FILTERS, PRICE_RANGE, toggleValue, visibleFilterValues, type ActiveFilters, type PriceBand } from './filterInputs';

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'FEATURED', label: 'collection.sortFeatured' },
  { key: 'BEST_SELLING', label: 'collection.sortBest' },
  { key: 'NEWEST', label: 'collection.sortNewest' },
  { key: 'PRICE_DESC', label: 'collection.sortPriceDesc' },
  { key: 'PRICE_ASC', label: 'collection.sortPriceAsc' },
];

function CheckRow({ value, checked, onPress }: { value: FilterValue; checked: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={`${value.label}, ${value.count}`}
      onPress={onPress}
      style={({ pressed }) => [styles.check, { opacity: pressed ? 0.7 : 1 }]}>
      <Icon name={checked ? 'checkbox' : 'square-outline'} color={checked ? colors.primaryText : colors.textSecondary} />
      <AppText style={styles.flex}>{value.label}</AppText>
      <AppText variant="caption" muted>
        {value.count}
      </AppText>
    </Pressable>
  );
}

function PriceSlider({ selected, onSelect }: { selected: PriceBand | null; onSelect: (band: PriceBand | null) => void }) {
  const { t, i18n } = useTranslation();
  const money = (amount: number) => formatMoney(amount, i18n.language);
  const low = selected?.min ?? PRICE_RANGE.min;
  const high = selected?.max ?? PRICE_RANGE.max;
  const highText = high >= PRICE_RANGE.max ? `${money(PRICE_RANGE.max)}+` : money(high);

  const change = (range: { low: number; high: number }) => {
    const unbounded = range.low === PRICE_RANGE.min && range.high >= PRICE_RANGE.max;
    onSelect(unbounded ? null : { min: range.low, max: range.high >= PRICE_RANGE.max ? null : range.high });
  };

  return (
    <View>
      <AppText variant="label" style={styles.priceValue}>{`${money(low)} – ${highText}`}</AppText>
      <RangeSlider
        {...PRICE_RANGE}
        value={{ low, high }}
        onChange={change}
        lowLabel={t('collection.priceMin')}
        highLabel={t('collection.priceMax')}
      />
    </View>
  );
}

function FilterGroup({ filter, draft, onChange }: { filter: ProductFilter; draft: ActiveFilters; onChange: (next: ActiveFilters) => void }) {
  const hasSelection = filter.type === 'PRICE_RANGE' ? draft.priceBand !== null : (draft.values[filter.id]?.length ?? 0) > 0;
  return (
    <Accordion title={filter.label} initiallyOpen={hasSelection}>
      {filter.type === 'PRICE_RANGE' ? (
        <PriceSlider selected={draft.priceBand} onSelect={(priceBand) => onChange({ ...draft, priceBand })} />
      ) : (
        visibleFilterValues(filter.values).map((value) => (
          <CheckRow
            key={value.input}
            value={value}
            checked={isSelected(draft, filter.id, value.input)}
            onPress={() => onChange(toggleValue(draft, filter.id, value.input))}
          />
        ))
      )}
    </Accordion>
  );
}

interface Props {
  visible: boolean;
  sort: SortKey;
  filters: ActiveFilters;
  /** Filters Shopify offers for this collection, already localized by the Storefront API. */
  available: ProductFilter[];
  onApply: (sort: SortKey, filters: ActiveFilters) => void;
  onClose: () => void;
}

/** Sort and filter together, as a draft: nothing reloads until the customer taps "Show results". */
export function FilterSortSheet({ visible, sort, filters, available, onApply, onClose }: Props) {
  const { t } = useTranslation();
  const [draftSort, setDraftSort] = useState(sort);
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (!visible) return;
    setDraftSort(sort);
    setDraft(filters);
  }, [visible, sort, filters]);

  const apply = () => {
    onApply(draftSort, draft);
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      title={t('collection.sortBy')}
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <Button
            label={t('collection.reset')}
            variant="secondary"
            onPress={() => {
              setDraftSort('FEATURED');
              setDraft(NO_FILTERS);
            }}
            style={styles.flex}
          />
          <Button label={t('collection.showResults')} onPress={apply} style={styles.primary} />
        </View>
      }>
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((option) => (
          <Chip key={option.key} label={t(option.label)} selected={draftSort === option.key} onPress={() => setDraftSort(option.key)} />
        ))}
      </View>
      {available.length ? (
        <View>
          <AppText variant="heading" accessibilityRole="header" style={styles.filterTitle}>
            {t('collection.filter')}
          </AppText>
          {available.map((filter) => (
            <FilterGroup key={filter.id} filter={filter} draft={draft} onChange={setDraft} />
          ))}
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  primary: { flex: 2 },
  footer: { flexDirection: 'row', gap: spacing.sm },
  filterTitle: { marginTop: spacing.sm },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  priceValue: { marginBottom: spacing.xs },
  check: { minHeight: minTouch, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
