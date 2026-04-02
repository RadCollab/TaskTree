import { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import { colors, typography, spacing } from '@/constants/theme';
import { Task, TaskList } from '@/data/types';
import { PenToSquareIcon, PriorityIcon, PlusIcon } from '@/components/icons';
import { TaskTypeIcon } from '@/components/icons/TaskTypeIcon';
import { TypeSelector } from './TypeSelector';

interface TaskItemProps {
  task: Task;
  list?: TaskList;
  allLists?: TaskList[];
  onToggleComplete: (id: string) => void;
  onUpdateTitle?: (id: string, title: string) => void;
  onDeleteTask?: (id: string) => void;
  onUpdateList?: (id: string, listId: string) => void;
  onUnscheduleTask?: (id: string) => void;
}

export function TaskItem({
  task,
  list,
  allLists,
  onToggleComplete,
  onUpdateTitle,
  onDeleteTask,
  onUpdateList,
  onUnscheduleTask,
}: TaskItemProps) {
  const isEvent = task.type === 'event';
  const listColor = list?.color ?? colors.content;
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.title);
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(undefined);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const toolbarTapRef = useRef(false);

  const handleContentPress = () => {
    if (task.isCompleted) return;
    setEditText(task.title);
    setSelection({ start: task.title.length, end: task.title.length });
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      setTimeout(() => setSelection(undefined), 50);
    }, 50);
  };

  const handleBlur = useCallback(() => {
    // Delay to let toolbar presses register before closing
    setTimeout(() => {
      if (toolbarTapRef.current) {
        toolbarTapRef.current = false;
        inputRef.current?.focus();
        return;
      }
      const trimmed = editText.trim();
      if (!trimmed) {
        onDeleteTask?.(task.id);
      } else if (trimmed !== task.title) {
        onUpdateTitle?.(task.id, trimmed);
      } else {
        setEditText(task.title);
      }
      setIsEditing(false);
      setShowTypeSelector(false);
    }, 100);
  }, [editText, task.title, task.id, onDeleteTask, onUpdateTitle]);

  const handleTypeSelect = (listId: string) => {
    toolbarTapRef.current = true;
    onUpdateList?.(task.id, listId);
    setShowTypeSelector(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleUnschedule = () => {
    toolbarTapRef.current = true;
    onUnscheduleTask?.(task.id);
    setIsEditing(false);
    setShowTypeSelector(false);
  };

  const showAllDay = isEvent && task.isAllDay && !task.startTime;

  return (
    <View style={[styles.container, task.isCompleted && styles.containerCompleted]}>
      {/* Checkbox */}
      <Pressable
        style={[styles.checkboxContainer, !task.isCompleted && { opacity: 0.5 }]}
        onPress={() => onToggleComplete(task.id)}
      >
        <TaskTypeIcon
          shape={list?.icon ?? 'heart'}
          variant={task.isCompleted ? 'complete' : 'incomplete'}
          color={listColor}
          size={22}
        />
      </Pressable>

      {/* Content */}
      <Pressable
        style={[
          styles.content,
          task.isCompleted && { opacity: 0.5 },
          isEditing && styles.contentEditing,
        ]}
        onPress={handleContentPress}
        disabled={task.isCompleted}
      >
        <View style={styles.taskInfo}>
          {task.isPriority && !task.isCompleted && !isEditing && (
            <View style={styles.priorityContainer}>
              <PriorityIcon size={16} color={listColor} />
            </View>
          )}

          <View style={[styles.labelContainer, isEditing && styles.labelContainerEditing]}>
            {isEditing ? (
              <TextInput
                ref={inputRef}
                style={[styles.title, Platform.OS === 'web' && { outlineStyle: 'none' as any }]}
                value={editText}
                onChangeText={setEditText}
                onBlur={handleBlur}
                multiline
                blurOnSubmit
                returnKeyType="done"
                scrollEnabled={false}
                selection={selection}
              />
            ) : (
              <Text
                style={[styles.title, task.isCompleted && styles.textCompleted]}
              >
                {task.title}
              </Text>
            )}
          </View>
        </View>

        {/* Edit toolbar - type badge and +More */}
        {isEditing && (
          <View style={styles.editToolbarWrapper}>
            <View style={styles.editToolbar}>
              <Pressable
                style={styles.typeBadge}
                onPressIn={() => { toolbarTapRef.current = true; }}
                onPress={() => setShowTypeSelector(!showTypeSelector)}
              >
                <TaskTypeIcon shape={list?.icon ?? 'heart'} variant="small" color={listColor} size={12} />
                <Text style={[styles.typeBadgeText, { color: listColor }]}>
                  {list?.name ?? 'Task'}
                </Text>
              </Pressable>
              <View style={styles.toolbarDivider} />
              <Pressable
                style={styles.moreButton}
                onPressIn={() => { toolbarTapRef.current = true; }}
                onPress={() => {}}
              >
                <PlusIcon size={10} color={colors.content} />
                <Text style={styles.moreButtonText}>More</Text>
              </Pressable>
              <View style={styles.toolbarDivider} />
              <Pressable
                style={styles.moreButton}
                onPressIn={handleUnschedule}
              >
                <PenToSquareIcon size={12} color={colors.content} />
                <Text style={styles.moreButtonText}>Reschedule</Text>
              </Pressable>
            </View>
            {showTypeSelector && allLists && (
              <Pressable
                style={styles.typeSelectorContainer}
                onPressIn={() => { toolbarTapRef.current = true; }}
              >
                <TypeSelector
                  lists={allLists}
                  currentListId={task.listId}
                  onSelect={handleTypeSelect}
                  onManage={() => {}}
                />
              </Pressable>
            )}
          </View>
        )}

        {/* Properties row (e.g. All Day) */}
        {showAllDay && !task.isCompleted && !isEditing && (
          <View style={styles.properties}>
            <Text style={styles.propertyText}>All Day</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 10,
    width: '100%',
    paddingHorizontal: spacing.xl,
  },
  containerCompleted: {
  },
  checkboxContainer: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentEditing: {
    backgroundColor: colors.border,
    borderRadius: 8,
    padding: 8,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  priorityContainer: {
    width: 10,
    paddingTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 10,
  },
  labelContainerEditing: {
    paddingTop: 4,
    paddingBottom: 6,
  },
  title: {
    ...typography.titleMedium,
    color: colors.content,
  },
  textCompleted: {
    textDecorationLine: 'line-through',
    color: colors.borderDk,
  },
  // Edit toolbar
  editToolbarWrapper: {
    position: 'relative',
  },
  editToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingLeft: 3,
    paddingRight: 5,
    paddingVertical: 3,
    borderRadius: 3,
  },
  typeBadgeText: {
    ...typography.bodyLarge,
    fontSize: 13,
  },
  toolbarDivider: {
    width: 1,
    height: 8,
    backgroundColor: colors.content,
    opacity: 0.2,
    borderRadius: 9,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 32,
    paddingVertical: 8,
  },
  moreButtonText: {
    ...typography.bodyLarge,
    fontSize: 13,
    color: colors.content,
    textDecorationLine: 'underline',
  },
  typeSelectorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  properties: {
    paddingBottom: 14,
  },
  propertyText: {
    ...typography.bodyLarge,
    color: colors.content,
  },
});
