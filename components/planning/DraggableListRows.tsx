import React, { useCallback, useLayoutEffect, useRef } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, spacing } from '@/constants/theme';
import { TaskList } from '@/data/types';

interface DraggableListRowsProps {
  lists: TaskList[];
  onReorder: (orderedIds: string[]) => void;
  renderRow: (list: TaskList) => React.ReactNode;
  gap?: number;
}

const TIMING = { duration: 220 };
const TIMING_FAST = { duration: 140 };

export function DraggableListRows({
  lists,
  onReorder,
  renderRow,
  gap = spacing.lg,
}: DraggableListRowsProps) {
  const itemHeights = useRef<number[]>(new Array(lists.length).fill(56));
  const activeIndex = useSharedValue(-1);
  const activeItemHeight = useSharedValue(0);
  const dragTranslation = useSharedValue(0);
  const hoverIndex = useSharedValue(-1);

  const rawHover = useRef(-1);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingReset = useRef(false);
  const listIdsRef = useRef(lists.map((list) => list.id));
  listIdsRef.current = lists.map((list) => list.id);

  if (itemHeights.current.length !== lists.length) {
    itemHeights.current = new Array(lists.length).fill(56);
  }

  const getItemOffset = useCallback((index: number) => {
    let offset = 0;
    for (let i = 0; i < index; i += 1) {
      offset += itemHeights.current[i] + gap;
    }
    return offset;
  }, [gap]);

  const getIndexAtY = useCallback((y: number) => {
    let offset = 0;
    for (let i = 0; i < itemHeights.current.length; i += 1) {
      const midpoint = offset + itemHeights.current[i] / 2;
      if (y < midpoint) return i;
      offset += itemHeights.current[i] + gap;
    }
    return itemHeights.current.length - 1;
  }, [gap]);

  const onDragStart = useCallback((index: number) => {
    activeItemHeight.value = itemHeights.current[index] + gap;
    rawHover.current = index;
  }, [activeItemHeight, gap]);

  const onPanUpdate = useCallback((index: number, translationY: number) => {
    const originalOffset = getItemOffset(index);
    const currentCenterY = originalOffset + translationY + itemHeights.current[index] / 2;
    const nextIndex = getIndexAtY(currentCenterY);

    if (nextIndex !== rawHover.current) {
      rawHover.current = nextIndex;
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(() => {
        hoverIndex.value = nextIndex;
      }, 120);
    }
  }, [getIndexAtY, getItemOffset, hoverIndex]);

  useLayoutEffect(() => {
    if (pendingReset.current) {
      pendingReset.current = false;
      activeIndex.value = -1;
      hoverIndex.value = -1;
      dragTranslation.value = 0;
    }
  });

  const commitAndReset = useCallback((fromIndex: number, toIndex: number) => {
    const ids = [...listIdsRef.current];
    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, moved);
    pendingReset.current = true;
    onReorder(ids);
  }, [onReorder]);

  const resetDrag = useCallback(() => {
    activeIndex.value = -1;
    hoverIndex.value = -1;
    dragTranslation.value = 0;
  }, [activeIndex, dragTranslation, hoverIndex]);

  const handleRelease = useCallback((fromIndex: number) => {
    const toIndex = hoverIndex.value;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    rawHover.current = -1;

    if (fromIndex !== toIndex && toIndex >= 0) {
      const targetOffset = getItemOffset(toIndex);
      const fromOffset = getItemOffset(fromIndex);
      dragTranslation.value = withTiming(targetOffset - fromOffset, TIMING_FAST, () => {
        runOnJS(commitAndReset)(fromIndex, toIndex);
      });
      return;
    }

    dragTranslation.value = withTiming(0, TIMING_FAST, () => {
      runOnJS(resetDrag)();
    });
  }, [commitAndReset, dragTranslation, getItemOffset, hoverIndex, resetDrag]);

  return (
    <View style={[styles.container, { gap }]}>
      {lists.map((list, index) => (
        <DraggableListRow
          key={list.id}
          index={index}
          list={list}
          totalItems={lists.length}
          itemHeights={itemHeights}
          activeIndex={activeIndex}
          activeItemHeight={activeItemHeight}
          dragTranslation={dragTranslation}
          hoverIndex={hoverIndex}
          onDragStart={onDragStart}
          onPanUpdate={onPanUpdate}
          handleRelease={handleRelease}
        >
          {renderRow(list)}
        </DraggableListRow>
      ))}
    </View>
  );
}

interface DraggableListRowProps {
  children: React.ReactNode;
  index: number;
  list: TaskList;
  totalItems: number;
  itemHeights: React.MutableRefObject<number[]>;
  activeIndex: SharedValue<number>;
  activeItemHeight: SharedValue<number>;
  dragTranslation: SharedValue<number>;
  hoverIndex: SharedValue<number>;
  onDragStart: (index: number) => void;
  onPanUpdate: (index: number, translationY: number) => void;
  handleRelease: (fromIndex: number) => void;
}

function DraggableListRow({
  children,
  index,
  totalItems,
  itemHeights,
  activeIndex,
  activeItemHeight,
  dragTranslation,
  hoverIndex,
  onDragStart,
  onPanUpdate,
  handleRelease,
}: DraggableListRowProps) {
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    itemHeights.current[index] = event.nativeEvent.layout.height;
  }, [index, itemHeights]);

  const longPress = Gesture.LongPress()
    .minDuration(160)
    .onStart(() => {
      activeIndex.value = index;
      dragTranslation.value = 0;
      hoverIndex.value = index;
      runOnJS(onDragStart)(index);
    });

  const pan = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((_event, state) => {
      if (activeIndex.value === index) {
        state.activate();
      } else {
        state.fail();
      }
    })
    .onUpdate((event) => {
      dragTranslation.value = event.translationY;
      runOnJS(onPanUpdate)(index, event.translationY);
    })
    .onEnd(() => {
      runOnJS(handleRelease)(index);
    });

  const gesture = Gesture.Simultaneous(longPress, pan);
  const baseZIndex = totalItems - index;

  const animatedStyle = useAnimatedStyle(() => {
    const from = activeIndex.value;

    if (from === index) {
      return {
        transform: [
          { translateY: dragTranslation.value },
          { scale: withTiming(1.02, TIMING_FAST) },
        ],
        zIndex: 999,
        shadowColor: '#000',
        shadowOpacity: withTiming(0.12, TIMING_FAST),
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
      };
    }

    if (from === -1) {
      return {
        transform: [{ translateY: 0 }, { scale: 1 }],
        zIndex: baseZIndex,
        shadowOpacity: 0,
      };
    }

    const to = hoverIndex.value;
    let shift = 0;

    if (to >= 0) {
      const activeHeight = activeItemHeight.value;
      if (from < to) {
        if (index > from && index <= to) shift = -activeHeight;
      } else if (from > to) {
        if (index >= to && index < from) shift = activeHeight;
      }
    }

    return {
      transform: [{ translateY: withTiming(shift, TIMING) }, { scale: 1 }],
      zIndex: baseZIndex,
      shadowOpacity: 0,
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.item, animatedStyle]} onLayout={handleLayout}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  item: {
    backgroundColor: colors.surface.card,
  },
});
