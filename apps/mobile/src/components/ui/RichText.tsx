import { StyleSheet, View } from 'react-native';

import type { RichBlock, TextRun } from '@/lib/richText';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { AppText } from './AppText';

function Runs({ runs }: { runs: TextRun[] }) {
  return runs.map((run, index) => (
    <AppText key={index} variant={run.bold ? 'bodyStrong' : 'body'} style={run.italic ? styles.italic : undefined}>
      {run.text}
    </AppText>
  ));
}

function ListBlock({ ordered, items }: { ordered: boolean; items: TextRun[][] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.list}>
      {items.map((runs, index) => (
        <View key={index} style={styles.item}>
          <AppText variant="bodyStrong" color={colors.primaryText} style={styles.marker}>
            {ordered ? `${index + 1}.` : '•'}
          </AppText>
          <AppText style={styles.itemText}>
            <Runs runs={runs} />
          </AppText>
        </View>
      ))}
    </View>
  );
}

/** Lays out parsed store content (policies, pages) with real headings, paragraphs and lists. */
export function RichText({ blocks }: { blocks: RichBlock[] }) {
  return (
    <View style={styles.body}>
      {blocks.map((block, index) =>
        block.kind === 'list' ? (
          <ListBlock key={index} ordered={block.ordered} items={block.items} />
        ) : block.kind === 'heading' ? (
          <AppText key={index} variant="heading" accessibilityRole="header" style={index > 0 ? styles.section : undefined}>
            {block.runs.map((run) => run.text).join('')}
          </AppText>
        ) : (
          <AppText key={index}>
            <Runs runs={block.runs} />
          </AppText>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.sm },
  section: { marginTop: spacing.md },
  italic: { fontStyle: 'italic' },
  list: { gap: spacing.xs },
  item: { flexDirection: 'row', gap: spacing.sm },
  marker: { minWidth: 18 },
  itemText: { flex: 1 },
});
