import { Redirect, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Accordion } from '@/components/ui/Accordion';
import { Header } from '@/components/ui/Header';
import { RichText } from '@/components/ui/RichText';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { isPolicyKey, POLICY_KEYS, usePolicyDocument, type PolicyKey } from '@/features/info/policyDocuments';
import { parseRichText, splitSections } from '@/lib/richText';
import { spacing } from '@/theme/tokens';

function PolicyBody({ policyKey }: { policyKey: PolicyKey }) {
  const { t } = useTranslation();
  const doc = usePolicyDocument(policyKey);
  const { intro, sections } = useMemo(() => splitSections(parseRichText(doc.data?.body ?? '')), [doc.data?.body]);

  if (doc.isLoading) return <LoadingState />;
  if (doc.isError) return <ErrorState onRetry={() => doc.refetch()} />;
  if (!intro.length && !sections.length) return <EmptyState message={t('common.error')} />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {intro.length ? <RichText blocks={intro} /> : null}
      <View>
        {sections.map((section) => (
          <Accordion key={section.title} title={section.title}>
            <RichText blocks={section.blocks} />
          </Accordion>
        ))}
      </View>
    </ScrollView>
  );
}

export default function PolicyScreen() {
  const { t } = useTranslation();
  const { key } = useLocalSearchParams<{ key: string }>();
  if (!isPolicyKey(key)) return <Redirect href="/policies" />;
  const label = POLICY_KEYS.find((k) => k.key === key)!.label;

  return (
    <Screen>
      <Header title={t(label)} />
      <PolicyBody policyKey={key} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
});
