import { useState, useRef } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/constants/theme';
import { useTaskTree } from '@/data/store';
import { RivePlaceholder } from '@/components/schedule/RivePlaceholder';
import { AgendaHeader } from '@/components/schedule/AgendaHeader';
import { TaskItem } from '@/components/schedule/TaskItem';

export default function ScheduleScreen() {
  const { tasks, lists, toggleComplete, addTask, updateTaskTitle } = useTaskTree();
  const insets = useSafeAreaInsets();
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const addInputRef = useRef<TextInput>(null);

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.date === today);
  const incompleteTasks = todayTasks.filter((t) => !t.isCompleted);


  const handleAddPress = () => {
    setIsAdding(true);
    setTimeout(() => addInputRef.current?.focus(), 50);
  };

  const handleAddSubmit = () => {
    const trimmed = newTaskText.trim();
    if (trimmed) {
      addTask(trimmed);
    }
    setNewTaskText('');
    setIsAdding(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <RivePlaceholder />
        <AgendaHeader />

        {/* Tasks - completed stay in place */}
        <View style={styles.taskList}>
          {todayTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              list={lists.find((l) => l.id === task.listId)}
              onToggleComplete={toggleComplete}
              onUpdateTitle={updateTaskTitle}
            />
          ))}
        </View>

        {/* Add button / inline input */}
        {isAdding ? (
          <View style={styles.addInputRow}>
            <View style={styles.addIconContainer}>
              <Text style={styles.addIconPlus}>+</Text>
            </View>
            <TextInput
              ref={addInputRef}
              style={styles.addInput}
              value={newTaskText}
              onChangeText={setNewTaskText}
              onBlur={handleAddSubmit}
              placeholder="New task..."
              placeholderTextColor={colors.borderDk}
              multiline
              blurOnSubmit
              returnKeyType="done"
            />
          </View>
        ) : (
          <Pressable style={styles.addButton} onPress={handleAddPress}>
            <View style={styles.addIconContainer}>
              <Text style={styles.addIconPlus}>+</Text>
            </View>
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        )}

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
  taskList: {
    gap: spacing.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
    opacity: 0.6,
  },
  addInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
  },
  addIconContainer: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIconPlus: {
    ...typography.titleMedium,
    color: colors.content,
    fontSize: 20,
  },
  addText: {
    ...typography.bodyLarge,
    color: colors.content,
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
});
