import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, typography, spacing } from '@/constants/theme';
import { Task, TaskList } from '@/data/types';
import { TaskItem } from './TaskItem';

interface CompletedSectionProps {
  tasks: Task[];
  lists: TaskList[];
  onToggleComplete: (id: string) => void;
}

export function CompletedSection({ tasks, lists, onToggleComplete }: CompletedSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={() => setIsExpanded(!isExpanded)}>
        <Text style={styles.label}>Completed</Text>
        <Text style={[styles.chevron, isExpanded && styles.chevronExpanded]}>›</Text>
      </Pressable>
      {isExpanded &&
        tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            list={lists.find((l) => l.id === task.listId)}
            onToggleComplete={onToggleComplete}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.bg,
    paddingVertical: spacing.lg,
    paddingHorizontal: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  label: {
    ...typography.bodySmall,
    color: colors.content,
    opacity: 0.7,
  },
  chevron: {
    fontSize: 14,
    color: colors.content,
    opacity: 0.7,
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
});
