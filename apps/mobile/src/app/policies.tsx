import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { Header } from '@/components/ui/Header';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { usePolicies } from '@/features/catalog/hooks';
import { htmlToText } from '@/lib/html';
import { spacing } from '@/theme/tokens';

const KEYS = [
  { key: 'shippingPolicy', label: 'policies.shipping' },
  { key: 'refundPolicy', label: 'policies.refund' },
  { key: 'privacyPolicy', label: 'policies.privacy' },
  { key: 'termsOfService', label: 'policies.terms' },
] as const;

type PolicyKey = (typeof KEYS)[number]['key'];

export default function PoliciesScreen() {
  const { t } = useTranslation();
  const policies = usePolicies();
  const params = useLocalSearchParams<{ policy?: PolicyKey }>();
  const [selected, setSelected] = useState<PolicyKey>(params.policy ?? 'shippingPolicy');
  const policy = policies.data?.[selected];

  return (
    <Screen>
      <Header title={t('account.policies')} />
      {policies.isLoading ? (
        <LoadingState />
      ) : policies.isError ? (
        <ErrorState onRetry={() => policies.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.chips}>
            {KEYS.map((k) => (
              <Chip key={k.key} label={t(k.label)} selected={selected === k.key} onPress={() => setSelected(k.key)} />
            ))}
          </View>
          {policy ? (
            <>
              <AppText variant="title" accessibilityRole="header">
                {policy.title}
              </AppText>
              <AppText muted>{htmlToText(policy.body)}</AppText>
            </>
          ) : null}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
