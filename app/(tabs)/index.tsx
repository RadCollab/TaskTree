import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/constants/theme';
import { useTaskTree } from '@/data/store';
import { RivePlaceholder } from '@/components/schedule/RivePlaceholder';
import { StatsBar } from '@/components/schedule/StatsBar';
import { AgendaHeader } from '@/components/schedule/AgendaHeader';
import { TaskItem } from '@/components/schedule/TaskItem';
import { CompletedSection } from '@/components/schedule/CompletedSection';

export default function ScheduleScreen() {
  const { tasks, lists, toggleComplete } = useTaskTree();
  const insets = useSafeAreaInsets();

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.date === today);
  const incompleteTasks = todayTasks.filter((t) => !t.isCompleted);
  const completedTasks = todayTasks.filter((t) => t.isCompleted);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <RivePlaceholder />
        <StatsBar />
        <AgendaHeader />

        {/* Incomplete tasks */}
        {incompleteTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            list={lists.find((l) => l.id === task.listId)}
            onToggleComplete={toggleComplete}
          />
        ))}

        {/* Add button */}
        <Pressable style={styles.addButton}>
          <Text style={styles.addIcon}>+</Text>
          <Text style={styles.addText}>Add</Text>
        </Pressable>

        {/* Completed section */}
        <CompletedSection
          tasks={completedTasks}
          lists={lists}
          onToggleComplete={toggleComplete}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  addIcon: {
    ...typography.titleMedium,
    color: colors.content,
    fontSize: 18,
  },
  addText: {
    ...typography.titleSmall,
    color: colors.content,
  },
});
