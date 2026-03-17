import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, typography, spacing } from '@/constants/theme';
import { Task, TaskList } from '@/data/types';

interface TaskItemProps {
  task: Task;
  list?: TaskList;
  onToggleComplete: (id: string) => void;
}

export function TaskItem({ task, list, onToggleComplete }: TaskItemProps) {
  const isEvent = task.type === 'event';
  const listColor = list?.color ?? colors.content;

  return (
    <Pressable
      style={[styles.container, task.isCompleted && styles.containerCompleted]}
      onPress={() => onToggleComplete(task.id)}
    >
      <View style={styles.leftSection}>
        {/* Checkbox */}
        <View
          style={[
            styles.checkbox,
            isEvent ? styles.checkboxSquare : styles.checkboxCircle,
            { borderColor: listColor },
            task.isCompleted && { backgroundColor: listColor },
          ]}
        >
          {task.isPriority && !task.isCompleted && (
            <Text style={[styles.priorityMark, { color: listColor }]}>!</Text>
          )}
          {task.isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {task.notes && (
            <Text style={[styles.subtitle, task.isCompleted && styles.textCompleted]}>
              {task.notes}
            </Text>
          )}
          <Text
            style={[styles.title, task.isCompleted && styles.textCompleted]}
            numberOfLines={3}
          >
            {task.title}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    minHeight: 42,
  },
  containerCompleted: {
    opacity: 0.5,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxCircle: {
    borderRadius: 10,
  },
  checkboxSquare: {
    borderRadius: 3,
  },
  priorityMark: {
    fontFamily: 'NunitoSans_900Black',
    fontSize: 11,
    marginTop: -1,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.content,
  },
  title: {
    ...typography.titleSmall,
    color: colors.content,
  },
  textCompleted: {
    textDecorationLine: 'line-through',
    color: colors.borderDk,
  },
});
