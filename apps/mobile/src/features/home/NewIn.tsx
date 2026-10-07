import { router } from 'expo-router';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/Skeleton';
import { useCollections } from '@/features/catalog/hooks';
import { CollectionTile } from './CollectionTile';
import { NEW_IN_COLLECTIONS } from './homeContent';
import { SectionHeading } from './SectionHeading';
import { radius, spacing } from '@/theme/tokens';

const TILE_SHARE = 0.6;

/** Big collection tiles for what just launched, like the website's NEW IN row. */
export function NewIn() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { data, isLoading } = useCollections();
  const tileWidth = width * TILE_SHARE;
  const tiles = NEW_IN_COLLECTIONS.flatMap((handle) => data?.find((c) => c.handle === handle) ?? []);
  if (!isLoading && tiles.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeading title={t('home.newIn')} />
      {isLoading ? (
        <View style={styles.list}>
          <Skeleton width={tileWidth} height={(tileWidth * 4) / 3} borderRadius={radius.sm} />
        </View>
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tiles}
          keyExtractor={(c) => c.handle}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <CollectionTile
              title={item.title}
              image={item.image}
              fallbackIcon="sparkles-outline"
              onPress={() => router.push({ pathname: '/collection/[handle]', params: { handle: item.handle } })}
              style={{ width: tileWidth }}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  list: { paddingHorizontal: spacing.md, gap: spacing.sm },
});
