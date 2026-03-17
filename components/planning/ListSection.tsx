import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, typography, spacing } from '@/constants/theme';
import { Task, TaskList } from '@/data/types';

interface ListSectionProps {
  list: TaskList;
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onToggleSelected: (id: string) => void;
  selectedIds: Set<string>;
}

export function ListSection({ list, tasks, onToggleComplete, onToggleSelected, selectedIds }: ListSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const incompleteTasks = tasks.filter((t) => !t.isCompleted);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable style={styles.header} onPress={() => setIsExpanded(!isExpanded)}>
        <View style={[styles.colorDot, { backgroundColor: list.color }]} />
        <Text style={styles.name}>{list.name}</Text>
        <View style={styles.rightSection}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{incompleteTasks.length}</Text>
          </View>
          <Text style={[styles.chevron, isExpanded && styles.chevronExpanded]}>›</Text>
        </View>
      </Pressable>

      {/* Items */}
      {isExpanded && (
        <View style={styles.items}>
          {incompleteTasks.map((task) => (
            <Pressable
              key={task.id}
              style={styles.item}
              onPress={() => onToggleSelected(task.id)}
            >
              <View
                style={[
                  styles.selectIcon,
                  selectedIds.has(task.id) && { backgroundColor: list.color, borderColor: list.color },
                ]}
              >
                {selectedIds.has(task.id) && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.itemContent}>
                {task.notes && <Text style={styles.itemSubtitle}>{task.notes}</Text>}
                <Text style={styles.itemTitle} numberOfLines={3}>
                  {task.title}
                </Text>
              </View>
            </Pressable>
          ))}

          {/* Add button */}
          <Pressable style={styles.addButton}>
            <Text style={styles.addIcon}>+</Text>
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.card,
    borderRadius: 8,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  name: {
    ...typography.titleMedium,
    color: colors.content,
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countBadge: {
    backgroundColor: colors.surface.bg,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    ...typography.bodySmall,
    color: colors.content,
  },
  chevron: {
    fontSize: 20,
    color: colors.content,
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  items: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  selectIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderDk,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemSubtitle: {
    ...typography.bodySmall,
    color: colors.content,
  },
  itemTitle: {
    ...typography.titleSmall,
    color: colors.content,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
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
