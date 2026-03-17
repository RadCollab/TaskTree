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
        <View style={styles.toggle}>
          <Text style={[styles.chevron, isExpanded && styles.chevronExpanded]}>›</Text>
        </View>
        <Text style={styles.label}>Completed ({tasks.length})</Text>
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
    marginTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  toggle: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    ...typography.titleMedium,
    color: colors.content,
    fontSize: 18,
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  label: {
    ...typography.bodySmall,
    color: colors.content,
  },
});
