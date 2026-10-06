import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Accordion } from '@/components/ui/Accordion';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { useReadingStart } from '@/lib/direction';
import { formatMoney } from '@/lib/format';
import type { FilterValue, ProductFilter, SortKey } from '@/lib/shopify/types';
import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, spacing } from '@/theme/tokens';
import { isSelected, NO_FILTERS, PRICE_BANDS, toggleValue, type ActiveFilters, type PriceBand } from './filterInputs';

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

function PriceBands({ selected, onSelect }: { selected: PriceBand | null; onSelect: (band: PriceBand | null) => void }) {
  const { i18n } = useTranslation();
  const money = (amount: number) => formatMoney(amount, i18n.language);
  return (
    <View style={styles.wrap}>
      {PRICE_BANDS.map((band) => {
        const active = selected?.min === band.min && selected?.max === band.max;
        const label = band.max === null ? `${money(band.min)}+` : `${money(band.min)} – ${money(band.max)}`;
        return <Chip key={band.min} label={label} selected={active} onPress={() => onSelect(active ? null : band)} />;
      })}
    </View>
  );
}

function FilterGroup({ filter, draft, onChange }: { filter: ProductFilter; draft: ActiveFilters; onChange: (next: ActiveFilters) => void }) {
  const hasSelection = filter.type === 'PRICE_RANGE' ? draft.priceBand !== null : (draft.values[filter.id]?.length ?? 0) > 0;
  return (
    <Accordion title={filter.label} initiallyOpen={hasSelection}>
      {filter.type === 'PRICE_RANGE' ? (
        <PriceBands selected={draft.priceBand} onSelect={(priceBand) => onChange({ ...draft, priceBand })} />
      ) : (
        filter.values.map((value) => (
          <CheckRow
            key={value.id}
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
  const sortStart = useReadingStart<ScrollView>();

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
      <ScrollView ref={sortStart.ref} {...sortStart.scrollProps} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
        {SORT_OPTIONS.map((option) => (
          <Chip key={option.key} label={t(option.label)} selected={draftSort === option.key} onPress={() => setDraftSort(option.key)} />
        ))}
      </ScrollView>
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
  sortRow: { gap: spacing.sm },
  filterTitle: { marginTop: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  check: { minHeight: minTouch, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
