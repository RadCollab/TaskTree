import { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import { colors, typography, spacing } from '@/constants/theme';
import { Task, TaskList } from '@/data/types';
import { PriorityIcon } from '@/components/icons';

interface TaskItemProps {
  task: Task;
  list?: TaskList;
  onToggleComplete: (id: string) => void;
  onUpdateTitle?: (id: string, title: string) => void;
}

export function TaskItem({ task, list, onToggleComplete, onUpdateTitle }: TaskItemProps) {
  const isEvent = task.type === 'event';
  const listColor = list?.color ?? colors.content;
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.title);
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(undefined);
  const inputRef = useRef<TextInput>(null);

  const handleContentPress = () => {
    if (task.isCompleted) return;
    setEditText(task.title);
    setSelection({ start: task.title.length, end: task.title.length });
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      // Clear controlled selection so the user can freely move the cursor after initial focus
      setTimeout(() => setSelection(undefined), 50);
    }, 50);
  };

  const handleSubmit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== task.title) {
      onUpdateTitle?.(task.id, trimmed);
    } else {
      setEditText(task.title);
    }
    setIsEditing(false);
  };

  const showAllDay = isEvent && task.isAllDay && !task.startTime;

  return (
    <View style={[styles.container, task.isCompleted && styles.containerCompleted]}>
      {/* Checkbox - separate 42x42 tap target */}
      <Pressable
        style={styles.checkboxContainer}
        onPress={() => onToggleComplete(task.id)}
      >
        <View
          style={[
            styles.checkbox,
            isEvent ? styles.checkboxSquare : styles.checkboxCircle,
            { borderColor: listColor },
            task.isCompleted && { backgroundColor: listColor, opacity: 1 },
          ]}
        >
          {task.isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </Pressable>

      {/* Content - tappable for editing */}
      <Pressable style={styles.content} onPress={handleContentPress} disabled={task.isCompleted}>
        <View style={styles.taskInfo}>
          {/* Priority indicator - outside checkbox, before label */}
          {task.isPriority && !task.isCompleted && (
            <View style={styles.priorityContainer}>
              <PriorityIcon size={16} color={listColor} />
            </View>
          )}

          <View style={styles.labelContainer}>
            {isEditing ? (
              <TextInput
                ref={inputRef}
                style={[styles.title, styles.titleInput]}
                value={editText}
                onChangeText={setEditText}
                onBlur={handleSubmit}
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

        {/* Properties row (e.g. All Day) */}
        {showAllDay && !task.isCompleted && (
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
    opacity: 0.5,
  },
  checkboxContainer: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  checkboxCircle: {
    borderRadius: 11,
  },
  checkboxSquare: {
    borderRadius: 4,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    opacity: 1,
  },
  content: {
    flex: 1,
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
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: {
    ...typography.titleMedium,
    color: colors.content,
  },
  titleInput: {
    padding: 4,
    margin: -4,
    backgroundColor: colors.border,
    borderRadius: 4,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  textCompleted: {
    textDecorationLine: 'line-through',
    color: colors.borderDk,
  },
  properties: {
    paddingBottom: 14,
  },
  propertyText: {
    ...typography.bodyLarge,
    color: colors.content,
  },
});
