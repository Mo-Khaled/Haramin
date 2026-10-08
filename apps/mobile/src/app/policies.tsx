import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Header } from '@/components/ui/Header';
import { ListRow } from '@/components/ui/ListRow';
import { RowGroup } from '@/components/ui/RowGroup';
import { Screen } from '@/components/ui/Screen';
import { useAvailablePolicies, type PolicyKey } from '@/features/info/policyDocuments';
import type { IconName } from '@/components/ui/Icon';
import { spacing } from '@/theme/tokens';
import { NO_OVERSCROLL } from '@/lib/scroll';

const ICONS: Record<PolicyKey, IconName> = {
  shippingPolicy: 'car-outline',
  refundPolicy: 'swap-horizontal-outline',
  privacyPolicy: 'lock-closed-outline',
  termsOfService: 'document-text-outline',
};

/** Index of the store's legal and service documents; each opens as collapsible sections. */
export default function PoliciesScreen() {
  const { t } = useTranslation();
  const documents = useAvailablePolicies();

  return (
    <Screen>
      <Header title={t('account.legal')} />
      <ScrollView {...NO_OVERSCROLL} contentContainerStyle={styles.content}>
        <RowGroup>
          {documents.map(({ key, label }) => (
            <ListRow
              key={key}
              icon={ICONS[key]}
              label={t(label)}
              onPress={() => router.push({ pathname: '/policy/[key]', params: { key } })}
            />
          ))}
        </RowGroup>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
});
