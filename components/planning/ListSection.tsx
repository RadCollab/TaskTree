import { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import { colors, typography, spacing } from '@/constants/theme';
import { Task, TaskList } from '@/data/types';
import { PlusIcon, ToggleIcon } from '@/components/icons';
import { TaskTypeIcon } from '@/components/icons/TaskTypeIcon';

interface ListSectionProps {
  list: TaskList;
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onToggleSelected: (id: string) => void;
  onAddTask: (title: string, listId: string) => void;
  onUpdateTaskTitle: (id: string, title: string) => void;
  onDeleteTask: (id: string) => void;
  selectedIds: Set<string>;
}

export function ListSection({
  list,
  tasks,
  onToggleComplete,
  onToggleSelected,
  onAddTask,
  onUpdateTaskTitle,
  onDeleteTask,
  selectedIds,
}: ListSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [editingSelection, setEditingSelection] = useState<{ start: number; end: number } | undefined>(undefined);
  const inputRef = useRef<TextInput>(null);
  const editInputRef = useRef<TextInput>(null);
  const isEvent = list.behavior === 'event';
  const isEmpty = tasks.length === 0;

  const handleAddPress = () => {
    setIsAdding(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleAddSubmit = () => {
    const trimmed = newText.trim();
    setNewText('');
    setIsAdding(false);
    if (trimmed) {
      onAddTask(trimmed, list.id);
    }
  };

  const handleStartEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskText(task.title);
    setEditingSelection({ start: task.title.length, end: task.title.length });
    setTimeout(() => {
      editInputRef.current?.focus();
      setTimeout(() => setEditingSelection(undefined), 50);
    }, 50);
  };

  const handleEditSubmit = (taskId: string) => {
    const trimmed = editingTaskText.trim();
    if (trimmed) {
      onUpdateTaskTitle(taskId, trimmed);
    } else {
      onDeleteTask(taskId);
    }
    setEditingTaskId(null);
    setEditingTaskText('');
    setEditingSelection(undefined);
  };

  const addInput = (
    <View style={styles.addInputRow}>
      <View style={styles.addIconContainer}>
        <PlusIcon size={12} color={colors.content} />
      </View>
      <TextInput
        ref={inputRef}
        style={styles.addInput}
        value={newText}
        onChangeText={setNewText}
        onBlur={handleAddSubmit}
        placeholder={`New ${isEvent ? 'event' : 'task'}...`}
        placeholderTextColor={colors.borderDk}
        multiline
        blurOnSubmit
        returnKeyType="done"
      />
    </View>
  );

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
        <View style={[styles.chevronIcon, isExpanded && styles.chevronIconExpanded]}>
          <ToggleIcon size={14} color={colors.content} />
        </View>
      </Pressable>

      {/* Items or empty state */}
      {isExpanded && (
        <>
          {isEmpty && !isAdding ? (
            <View style={styles.emptyContainer}>
              <Pressable style={styles.emptyAddButton} onPress={handleAddPress}>
                <View style={styles.addIconContainer}>
                  <Text style={styles.addIcon}>+</Text>
                </View>
                <Text style={styles.emptyAddText}>Add {isEvent ? 'Event' : 'Task'}</Text>
              </Pressable>
            </View>
          ) : isEmpty && isAdding ? (
            <View style={styles.emptyContainer}>
              {addInput}
            </View>
          ) : (
            <>
              <View style={styles.divider} />
              <View style={styles.items}>
                {tasks.map((task) => (
                  <View key={task.id} style={styles.item}>
                    <Pressable
                      style={[styles.checkboxContainer, selectedIds.has(task.id) && styles.checkboxContainerSelected]}
                      hitSlop={8}
                      onPress={() => onToggleSelected(task.id)}
                    >
                      <TaskTypeIcon
                        shape={list.icon}
                        variant={selectedIds.has(task.id) ? 'complete' : 'incomplete'}
                        color={list.color}
                        size={14}
                      />
                    </Pressable>
                    <Pressable style={styles.itemLabel} onPress={() => handleStartEditing(task)}>
                      {editingTaskId === task.id ? (
                        <TextInput
                          ref={editInputRef}
                          style={styles.itemTitleInput}
                          value={editingTaskText}
                          onChangeText={setEditingTaskText}
                          onBlur={() => handleEditSubmit(task.id)}
                          onSubmitEditing={() => handleEditSubmit(task.id)}
                          multiline
                          blurOnSubmit
                          returnKeyType="done"
                          scrollEnabled={false}
                          selection={editingSelection}
                        />
                      ) : (
                        <Text style={styles.itemTitle}>{task.title}</Text>
                      )}
                    </Pressable>
                  </View>
                ))}

                {/* Add button / input */}
                {isAdding ? (
                  addInput
                ) : (
                  <Pressable style={styles.addButton} onPress={handleAddPress}>
                    <View style={styles.addIconContainer}>
                      <PlusIcon size={12} color={colors.content} />
                    </View>
                    <Text style={styles.addText}>Add</Text>
                  </Pressable>
                )}
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
  chevronIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronIconExpanded: {
    transform: [{ rotate: '90deg' }],
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
    opacity: 0.5,
  },
  checkboxContainerSelected: {
    opacity: 1,
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
  itemTitleInput: {
    ...typography.titleMedium,
    color: colors.content,
    padding: 0,
    width: '100%',
    textAlignVertical: 'top',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
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
  // Add input
  addInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 4,
  },
  addInput: {
    ...typography.titleMedium,
    color: colors.content,
    flex: 1,
    padding: 4,
    backgroundColor: colors.border,
    borderRadius: 4,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
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
