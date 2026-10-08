import { Linking, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Header } from '@/components/ui/Header';
import { ListRow } from '@/components/ui/ListRow';
import { RowGroup } from '@/components/ui/RowGroup';
import { Screen } from '@/components/ui/Screen';
import { STORE_INFO, whatsappUrl } from '@/features/info/storeInfo';
import { spacing } from '@/theme/tokens';
import { NO_OVERSCROLL } from '@/lib/scroll';

export default function ContactScreen() {
  const { t } = useTranslation();
  const open = (url: string) => () => Linking.openURL(url);

  return (
    <Screen>
      <Header title={t('info.contact')} />
      <ScrollView {...NO_OVERSCROLL} contentContainerStyle={styles.content}>
        <AppText muted style={styles.intro}>
          {t('info.contactIntro')}
        </AppText>
        <RowGroup>
          <ListRow icon="logo-whatsapp" label={t('info.whatsapp')} onPress={open(whatsappUrl(STORE_INFO.whatsapp))} />
          <ListRow icon="call-outline" label={t('info.call')} detail={STORE_INFO.phone} onPress={open(`tel:${STORE_INFO.phone}`)} />
          <ListRow icon="mail-outline" label={t('info.email')} detail={STORE_INFO.email} onPress={open(`mailto:${STORE_INFO.email}`)} />
          <ListRow icon="logo-instagram" label="Instagram" onPress={open(STORE_INFO.instagram)} />
          <ListRow icon="logo-facebook" label="Facebook" onPress={open(STORE_INFO.facebook)} />
        </RowGroup>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  intro: { paddingVertical: spacing.md },
});
