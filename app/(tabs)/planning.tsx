import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/constants/theme';
import { useTaskTree } from '@/data/store';
import { ListSection } from '@/components/planning/ListSection';
import { MultiSelectBar } from '@/components/planning/MultiSelectBar';

export default function PlanningScreen() {
  const { tasks, lists, toggleComplete, toggleSelected, selectedIds, clearSelection } = useTaskTree();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.hintBar}>
        <Text style={styles.hintText}>Tap on the left icon to multi-select</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {lists.map((list) => (
          <ListSection
            key={list.id}
            list={list}
            tasks={tasks.filter((t) => t.listId === list.id)}
            onToggleComplete={toggleComplete}
            onToggleSelected={toggleSelected}
            selectedIds={selectedIds}
          />
        ))}

        {/* Manage Lists button */}
        <Pressable style={styles.manageButton}>
          <Text style={styles.manageIcon}>⚙️</Text>
          <Text style={styles.manageText}>Manage Lists</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      <MultiSelectBar
        selectedCount={selectedIds.size}
        onClear={clearSelection}
        onAddToSchedule={() => {
          clearSelection();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.bg,
  },
  hintBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  hintText: {
    ...typography.titleSmall,
    color: colors.borderDk,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  manageIcon: {
    fontSize: 14,
  },
  manageText: {
    ...typography.bodySmall,
    color: colors.content,
  },
});
