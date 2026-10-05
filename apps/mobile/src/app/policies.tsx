import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { Header } from '@/components/ui/Header';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { POLICY_KEYS, usePolicyDocument, type PolicyKey } from '@/features/info/policyDocuments';
import { htmlToText } from '@/lib/html';
import { spacing } from '@/theme/tokens';

export default function PoliciesScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ policy?: PolicyKey }>();
  const [selected, setSelected] = useState<PolicyKey>(params.policy ?? 'shippingPolicy');
  const policyDoc = usePolicyDocument(selected);

  return (
    <Screen>
      <Header title={t('account.policies')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.chips}>
          {POLICY_KEYS.map((k) => (
            <Chip key={k.key} label={t(k.label)} selected={selected === k.key} onPress={() => setSelected(k.key)} />
          ))}
        </View>
        {policyDoc.isLoading ? (
          <LoadingState />
        ) : policyDoc.isError ? (
          <ErrorState onRetry={() => policyDoc.refetch()} />
        ) : policyDoc.data ? (
          <>
            <AppText variant="title" accessibilityRole="header">
              {policyDoc.data.title}
            </AppText>
            <AppText muted>{htmlToText(policyDoc.data.body)}</AppText>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
