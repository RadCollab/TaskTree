import React, { useCallback, useLayoutEffect, useRef } from 'react';
import { View, StyleSheet, LayoutChangeEvent, Easing } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Task, TaskList } from '@/data/types';
import { TaskItem } from './TaskItem';
import { spacing } from '@/constants/theme';

interface DraggableTaskListProps {
  tasks: Task[];
  lists: TaskList[];
  onToggleComplete: (id: string) => void;
  onUpdateTitle?: (id: string, title: string) => void;
  onDeleteTask?: (id: string) => void;
  onUpdateList?: (id: string, listId: string) => void;
  onUnscheduleTask?: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  gap?: number;
}

const TIMING = { duration: 250, easing: Easing.out(Easing.cubic) };
const TIMING_FAST = { duration: 150, easing: Easing.out(Easing.cubic) };

export function DraggableTaskList({
  tasks,
  lists,
  onToggleComplete,
  onUpdateTitle,
  onDeleteTask,
  onUpdateList,
  onUnscheduleTask,
  onReorder,
  gap = spacing.lg,
}: DraggableTaskListProps) {
  const itemHeights = useRef<number[]>(new Array(tasks.length).fill(50));
  const activeIndex = useSharedValue(-1);
  const activeItemHeight = useSharedValue(0);
  const dragTranslation = useSharedValue(0);
  const hoverIndex = useSharedValue(-1);

  const rawHover = useRef(-1);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingReset = useRef(false);
  const taskIdsRef = useRef(tasks.map((t) => t.id));
  taskIdsRef.current = tasks.map((t) => t.id);

  // Sync heights array length
  if (itemHeights.current.length !== tasks.length) {
    itemHeights.current = new Array(tasks.length).fill(50);
  }

  const getItemOffset = useCallback(
    (index: number): number => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += itemHeights.current[i] + gap;
      }
      return offset;
    },
    [gap]
  );

  const getIndexAtY = useCallback(
    (y: number): number => {
      let offset = 0;
      for (let i = 0; i < itemHeights.current.length; i++) {
        const mid = offset + itemHeights.current[i] / 2;
        if (y < mid) return i;
        offset += itemHeights.current[i] + gap;
      }
      return itemHeights.current.length - 1;
    },
    [gap]
  );

  const onDragStart = useCallback(
    (index: number) => {
      activeItemHeight.value = itemHeights.current[index] + gap;
      rawHover.current = index;
    },
    [activeItemHeight, gap]
  );

  const onPanUpdate = useCallback(
    (index: number, translationY: number) => {
      const originalOffset = getItemOffset(index);
      const currentCenterY =
        originalOffset + translationY + itemHeights.current[index] / 2;
      const newIdx = getIndexAtY(currentCenterY);

      if (newIdx !== rawHover.current) {
        rawHover.current = newIdx;
        if (settleTimer.current) clearTimeout(settleTimer.current);
        settleTimer.current = setTimeout(() => {
          hoverIndex.value = newIdx;
        }, 200);
      }
    },
    [getItemOffset, getIndexAtY, hoverIndex]
  );

  // Reset shared values AFTER React commits the re-render with new task order,
  // so items are already at their new DOM positions when translateY snaps to 0.
  useLayoutEffect(() => {
    if (pendingReset.current) {
      pendingReset.current = false;
      activeIndex.value = -1;
      hoverIndex.value = -1;
      dragTranslation.value = 0;
    }
  });

  const commitAndReset = useCallback(
    (fromIdx: number, toIdx: number) => {
      const ids = [...taskIdsRef.current];
      const [moved] = ids.splice(fromIdx, 1);
      ids.splice(toIdx, 0, moved);
      pendingReset.current = true;
      onReorder(ids);
    },
    [onReorder]
  );

  const resetDrag = useCallback(() => {
    activeIndex.value = -1;
    hoverIndex.value = -1;
    dragTranslation.value = 0;
  }, [activeIndex, hoverIndex, dragTranslation]);

  const handleRelease = useCallback(
    (fromIdx: number) => {
      const toIdx = hoverIndex.value;
      if (settleTimer.current) clearTimeout(settleTimer.current);
      rawHover.current = -1;

      if (fromIdx !== toIdx && toIdx >= 0) {
        // Animate dragged item to its target slot, keep gap open
        const targetOffset = getItemOffset(toIdx);
        const fromOffset = getItemOffset(fromIdx);
        const targetTranslateY = targetOffset - fromOffset;

        dragTranslation.value = withTiming(targetTranslateY, TIMING_FAST, () => {
          runOnJS(commitAndReset)(fromIdx, toIdx);
        });
      } else {
        // Snap back
        dragTranslation.value = withTiming(0, TIMING_FAST, () => {
          runOnJS(resetDrag)();
        });
      }
    },
    [hoverIndex, dragTranslation, getItemOffset, commitAndReset, resetDrag]
  );

  return (
    <View style={styles.container}>
      {tasks.map((task, index) => (
        <DraggableItem
          key={task.id}
          task={task}
          index={index}
          list={lists.find((l) => l.id === task.listId)}
          allLists={lists}
          onToggleComplete={onToggleComplete}
          onUpdateTitle={onUpdateTitle}
          onDeleteTask={onDeleteTask}
          onUpdateList={onUpdateList}
          onUnscheduleTask={onUnscheduleTask}
          activeIndex={activeIndex}
          activeItemHeight={activeItemHeight}
          dragTranslation={dragTranslation}
          hoverIndex={hoverIndex}
          itemHeights={itemHeights}
          onDragStart={onDragStart}
          onPanUpdate={onPanUpdate}
          handleRelease={handleRelease}
          totalItems={tasks.length}
          gap={gap}
        />
      ))}
    </View>
  );
}

interface DraggableItemProps {
  task: Task;
  index: number;
  list?: TaskList;
  allLists: TaskList[];
  onToggleComplete: (id: string) => void;
  onUpdateTitle?: (id: string, title: string) => void;
  onDeleteTask?: (id: string) => void;
  onUpdateList?: (id: string, listId: string) => void;
  onUnscheduleTask?: (id: string) => void;
  activeIndex: SharedValue<number>;
  activeItemHeight: SharedValue<number>;
  dragTranslation: SharedValue<number>;
  hoverIndex: SharedValue<number>;
  itemHeights: React.MutableRefObject<number[]>;
  onDragStart: (index: number) => void;
  onPanUpdate: (index: number, translationY: number) => void;
  handleRelease: (fromIdx: number) => void;
  totalItems: number;
  gap: number;
}

function DraggableItem({
  task,
  index,
  list,
  allLists,
  onToggleComplete,
  onUpdateTitle,
  onDeleteTask,
  onUpdateList,
  onUnscheduleTask,
  activeIndex,
  activeItemHeight,
  dragTranslation,
  hoverIndex,
  itemHeights,
  onDragStart,
  onPanUpdate,
  handleRelease,
  totalItems,
  gap,
}: DraggableItemProps) {
  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      itemHeights.current[index] = e.nativeEvent.layout.height;
    },
    [index, itemHeights]
  );

  const longPress = Gesture.LongPress()
    .minDuration(200)
    .onStart(() => {
      activeIndex.value = index;
      dragTranslation.value = 0;
      hoverIndex.value = index;
      runOnJS(onDragStart)(index);
    });

  const pan = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((_e, state) => {
      if (activeIndex.value === index) {
        state.activate();
      } else {
        state.fail();
      }
    })
    .onUpdate((e) => {
      dragTranslation.value = e.translationY;
      runOnJS(onPanUpdate)(index, e.translationY);
    })
    .onEnd(() => {
      runOnJS(handleRelease)(index);
    })
    .onFinalize(() => {
      // Safety reset if gesture cancelled without onEnd
    });

  const composed = Gesture.Simultaneous(longPress, pan);

  const baseZIndex = totalItems - index;

  const animatedStyle = useAnimatedStyle(() => {
    const from = activeIndex.value;

    // This is the dragged item
    if (from === index) {
      return {
        transform: [
          { translateY: dragTranslation.value },
          { scale: withTiming(1.03, TIMING_FAST) },
        ],
        zIndex: 999,
        shadowOpacity: withTiming(0.15, TIMING_FAST),
        shadowRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
      };
    }

    // Not dragging anything — snap immediately, React reorder handles position
    if (from === -1) {
      return {
        transform: [
          { translateY: 0 },
          { scale: 1 },
        ],
        zIndex: baseZIndex,
        shadowOpacity: 0,
        shadowRadius: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
      };
    }

    // Another item is being dragged — shift to make room at hoverIndex
    const to = hoverIndex.value;
    let shift = 0;

    if (to >= 0) {
      const h = activeItemHeight.value;
      if (from < to) {
        // Dragging down: items between from+1..to shift up
        if (index > from && index <= to) shift = -h;
      } else if (from > to) {
        // Dragging up: items between to..from-1 shift down
        if (index >= to && index < from) shift = h;
      }
    }

    return {
      transform: [
        { translateY: withTiming(shift, TIMING) },
        { scale: 1 },
      ],
      zIndex: baseZIndex,
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
    };
  });

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[styles.item, animatedStyle]}
        onLayout={handleLayout}
      >
        <TaskItem
          task={task}
          list={list}
          allLists={allLists}
          onToggleComplete={onToggleComplete}
          onUpdateTitle={onUpdateTitle}
          onDeleteTask={onDeleteTask}
          onUpdateList={onUpdateList}
          onUnscheduleTask={onUnscheduleTask}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  item: {
    backgroundColor: 'transparent',
  },
});
