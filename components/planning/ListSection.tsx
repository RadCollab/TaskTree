import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, typography, spacing } from '@/constants/theme';
import { Task, TaskList } from '@/data/types';
import { TaskTypeIcon } from '@/components/icons/TaskTypeIcon';

interface ListSectionProps {
  list: TaskList;
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onToggleSelected: (id: string) => void;
  selectedIds: Set<string>;
}

export function ListSection({ list, tasks, onToggleComplete, onToggleSelected, selectedIds }: ListSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isEvent = list.behavior === 'event';
  const isEmpty = tasks.length === 0;

  return (
    <View style={[styles.container, !isExpanded && styles.containerCollapsed]}>
      {/* Color tint overlay */}
      <View style={[styles.colorOverlay, { backgroundColor: list.color }]} />

      {/* Header */}
      <Pressable style={styles.header} onPress={() => setIsExpanded(!isExpanded)}>
        <TaskTypeIcon shape={list.icon} variant="complete" color={list.color} size={24} />
        <Text style={styles.headerName}>{list.name}</Text>
        {!isExpanded && tasks.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{tasks.length}</Text>
          </View>
        )}
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      {/* Items or empty state */}
      {isExpanded && (
        <>
          {isEmpty ? (
            <View style={styles.emptyContainer}>
              <Pressable style={styles.emptyAddButton}>
                <View style={styles.addIconContainer}>
                  <Text style={styles.addIcon}>+</Text>
                </View>
                <Text style={styles.emptyAddText}>Add {list.name === 'Events' ? 'Event' : 'Task'}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.divider} />
              <View style={styles.items}>
                {tasks.map((task) => (
                  <Pressable
                    key={task.id}
                    style={styles.item}
                    onPress={() => onToggleSelected(task.id)}
                  >
                    <View style={[styles.checkboxContainer, !selectedIds.has(task.id) && { opacity: 0.5 }]}>
                      <TaskTypeIcon
                        shape={list.icon}
                        variant={selectedIds.has(task.id) ? 'complete' : 'incomplete'}
                        color={list.color}
                        size={14}
                      />
                    </View>
                    <View style={styles.itemLabel}>
                      <Text style={styles.itemTitle}>{task.title}</Text>
                    </View>
                  </Pressable>
                ))}

                {/* Add button */}
                <Pressable style={styles.addButton}>
                  <View style={styles.addIconContainer}>
                    <Text style={styles.addIcon}>+</Text>
                  </View>
                  <Text style={styles.addText}>Add</Text>
                </Pressable>
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingVertical: 24,
    gap: 16,
  },
  colorOverlay: {
    position: 'absolute',
    top: -1,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  headerName: {
    ...typography.bodySmall,
    fontSize: 16,
    lineHeight: 20,
    flex: 1,
    color: colors.content,
  },
  chevron: {
    fontSize: 18,
    color: colors.content,
    lineHeight: 14,
  },
  containerCollapsed: {
    paddingVertical: 16,
  },
  countBadge: {
    width: 24,
    height: 24,
    borderRadius: 35,
    backgroundColor: 'rgba(49,42,71,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    ...typography.bodyLarge,
    color: colors.content,
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: '#d9d9d9',
  },
  // Items
  items: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    gap: 4,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  itemLabel: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 9,
  },
  itemTitle: {
    ...typography.titleMedium,
    color: colors.content,
  },
  // Add button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 4,
    opacity: 0.6,
  },
  addIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    ...typography.titleMedium,
    color: colors.content,
    fontSize: 18,
  },
  addText: {
    ...typography.bodyLarge,
    color: colors.content,
  },
  // Empty state
  emptyContainer: {
    paddingHorizontal: 16,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.borderDk,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  emptyAddText: {
    ...typography.bodyLarge,
    color: colors.content,
  },
});
