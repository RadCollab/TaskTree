import { useState, useRef, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
  Easing,
  Alert,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, shadows } from '@/constants/theme';
import { useTaskTree } from '@/data/store';
import { RivePlaceholder } from '@/components/schedule/RivePlaceholder';
import { AgendaHeader } from '@/components/schedule/AgendaHeader';
import { DraggableTaskList } from '@/components/schedule/DraggableTaskList';
import { ScheduleEmptyState } from '@/components/schedule/ScheduleEmptyState';
import { ListSection } from '@/components/planning/ListSection';
import { ManageListsFlow } from '@/components/planning/ManageListsFlow';
import { MultiSelectBar } from '@/components/planning/MultiSelectBar';
import { EllipsisIcon, ListCheckIcon, PenToSquareIcon } from '@/components/icons';

const SLIDE_TIMING = { duration: 400, easing: Easing.out(Easing.cubic) };

export default function MainScreen() {
  const {
    tasks, lists, toggleComplete, addTask, updateTaskTitle, updateTaskDetails,
    reorderTasks, updateTaskList, toggleSelected, selectedIds, clearSelection, unscheduleTask,
    scheduleTaskIds, deleteTasks, createList, updateList, reorderLists,
  } = useTaskTree();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<'schedule' | 'planning'>('schedule');
  const [isManageListsOpen, setIsManageListsOpen] = useState(false);
  const slideY = useSharedValue(0);

  // Schedule state
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [scheduleListId, setScheduleListId] = useState<string | undefined>(undefined);
  const addInputRef = useRef<TextInput>(null);

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) =>
    t.type === 'event' ? t.date === today : t.scheduledDate === today
  );
  const isScheduleEmpty = todayTasks.length === 0;
  const taskListId = lists.find((list) => list.isSystem && list.behavior === 'task')?.id;
  const eventListId = lists.find((list) => list.isSystem && list.behavior === 'event')?.id;
  const isAddingEvent =
    !!scheduleListId && (lists.find((list) => list.id === scheduleListId)?.behavior === 'event');

  // The schedule section height = screen height minus tab bar area
  const TAB_BAR_HEIGHT = 70;
  const scheduleHeight = screenHeight - TAB_BAR_HEIGHT - insets.bottom;

  const switchTab = useCallback((tab: 'schedule' | 'planning') => {
    setActiveTab(tab);
    slideY.value = withTiming(
      tab === 'planning' ? -scheduleHeight : 0,
      SLIDE_TIMING
    );
  }, [slideY, scheduleHeight]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  // Schedule handlers
  const handleAddPress = (listId?: string) => {
    setScheduleListId(listId);
    setIsAdding(true);
    setTimeout(() => addInputRef.current?.focus(), 50);
  };

  const handleAddSubmit = () => {
    const trimmed = newTaskText.trim();
    if (trimmed) addTask(trimmed, scheduleListId, today);
    setNewTaskText('');
    setScheduleListId(undefined);
    setIsAdding(false);
  };

  return (
    <View style={[styles.outerContainer, { paddingBottom: insets.bottom }]}>
      <Animated.View style={[styles.slideContainer, animatedContainerStyle]}>
        {/* ===== SCHEDULE SECTION ===== */}
        <View style={[styles.scheduleSection, { height: scheduleHeight, paddingTop: insets.top }]}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <RivePlaceholder />
            <AgendaHeader hideActions={isScheduleEmpty} />

            {isScheduleEmpty && !isAdding ? (
              <ScheduleEmptyState
                onAddTask={() => handleAddPress(taskListId)}
                onAddEvent={() => handleAddPress(eventListId)}
              />
            ) : (
              <DraggableTaskList
                tasks={todayTasks}
                lists={lists}
                onToggleComplete={toggleComplete}
                onUpdateTitle={updateTaskTitle}
                onUpdateList={updateTaskList}
                onUpdateDetails={updateTaskDetails}
                onManageLists={() => setIsManageListsOpen(true)}
                onUnscheduleTask={unscheduleTask}
                onReorder={reorderTasks}
              />
            )}

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
                  placeholder={`New ${isAddingEvent ? 'event' : 'task'}...`}
                  placeholderTextColor={colors.borderDk}
                  multiline
                  blurOnSubmit
                  returnKeyType="done"
                />
              </View>
            ) : !isScheduleEmpty ? (
              <Pressable style={styles.addButton} onPress={() => handleAddPress()}>
                <View style={styles.addIconContainer}>
                  <Text style={styles.addIconPlus}>+</Text>
                </View>
                <Text style={styles.addText}>Add</Text>
              </Pressable>
            ) : null}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>

        {/* ===== TAB BAR ===== */}
        <View style={[styles.tabBar, activeTab === 'schedule' && styles.tabBarSchedule]}>
          <View style={styles.segmentBar}>
            <Pressable
              style={[styles.segmentItem, activeTab === 'schedule' && styles.segmentItemActive]}
              onPress={() => switchTab('schedule')}
            >
              <ListCheckIcon size={16} color={colors.content} />
              <Text style={styles.segmentLabel}>Schedule</Text>
            </Pressable>
            <Pressable
              style={[styles.segmentItem, activeTab === 'planning' && styles.segmentItemActive]}
              onPress={() => switchTab('planning')}
            >
              <PenToSquareIcon size={16} color={colors.content} />
              <Text style={styles.segmentLabel}>Planning</Text>
            </Pressable>
          </View>
        </View>

        {/* ===== PLANNING SECTION ===== */}
        <View style={[styles.planningSection, { height: screenHeight - TAB_BAR_HEIGHT - insets.top }]}>
          <View style={styles.hintBar}>
            <Text style={styles.hintText}>Tap on the left icon to multi-select</Text>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.planningScrollContent}>
            {lists.map((list) => (
              <ListSection
                key={list.id}
                list={list}
                tasks={tasks.filter((t) =>
                  t.listId === list.id &&
                  !t.isCompleted &&
                  (t.type === 'event' ? !t.date : !t.scheduledDate)
                )}
                onToggleComplete={toggleComplete}
                onToggleSelected={toggleSelected}
                onAddTask={addTask}
                onUpdateTaskTitle={updateTaskTitle}
                onDeleteTask={(taskId) => deleteTasks([taskId])}
                selectedIds={selectedIds}
              />
            ))}

            <Pressable style={styles.manageButton} onPress={() => setIsManageListsOpen(true)}>
              <EllipsisIcon size={17} color={colors.content} />
              <Text style={styles.manageText}>Manage lists</Text>
            </Pressable>

            <View style={{ height: 40 }} />
          </ScrollView>

          <MultiSelectBar
            selectedCount={selectedIds.size}
            onClear={() => {
              if (selectedIds.size === 0) return;
              const count = selectedIds.size;
              const msg = `Are you sure you want to delete ${count} task${count > 1 ? 's' : ''}?`;
              const doDelete = () => {
                deleteTasks([...selectedIds]);
                clearSelection();
              };
              if (Platform.OS === 'web') {
                if (window.confirm(msg)) doDelete();
              } else {
                Alert.alert('Delete Tasks', msg, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: doDelete },
                ]);
              }
            }}
            onAddToSchedule={() => {
              scheduleTaskIds([...selectedIds]);
              clearSelection();
            }}
          />
        </View>
      </Animated.View>

      <ManageListsFlow
        lists={lists}
        visible={isManageListsOpen}
        onClose={() => setIsManageListsOpen(false)}
        onCreateList={createList}
        onUpdateList={updateList}
        onReorderLists={reorderLists}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: colors.surface.bg,
    overflow: 'hidden',
  },
  slideContainer: {
    flex: 0,
  },
  // Schedule
  scheduleSection: {
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
  // Tab bar
  tabBar: {
    backgroundColor: colors.surface.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
    paddingBottom: 16,
  },
  tabBarSchedule: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  segmentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.border,
    borderRadius: 57,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 108,
  },
  segmentItemActive: {
    backgroundColor: colors.surface.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...shadows.nav,
  },
  segmentLabel: {
    ...typography.bodySmall,
    color: colors.content,
  },
  // Planning
  planningSection: {
    backgroundColor: colors.surface.bg,
  },
  hintBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  hintText: {
    ...typography.titleSmall,
    color: colors.borderDk,
    textAlign: 'center',
  },
  planningScrollContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginHorizontal: spacing.lg,
    alignSelf: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.borderDk,
    borderRadius: 66,
  },
  manageText: {
    ...typography.bodyLarge,
    color: colors.content,
  },
  manageIcon: {
    color: colors.content,
  },
});
