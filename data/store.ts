import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Task, TaskList, IconShape } from './types';
import { mockTasks, mockLists } from './mockData';

interface CreateListInput {
  name: string;
  color: string;
  icon: IconShape;
  behavior: 'task' | 'event';
  defaultRepeats: boolean;
  defaultNotificationEnabled: boolean;
}

interface UpdateListInput {
  name?: string;
  color?: string;
  icon?: IconShape;
  behavior?: 'task' | 'event';
  defaultRepeats?: boolean;
  defaultNotificationEnabled?: boolean;
}

interface TaskTreeState {
  lists: TaskList[];
  tasks: Task[];
  selectedIds: Set<string>;
  isHydrated: boolean;
  toggleComplete: (taskId: string) => void;
  toggleSelected: (taskId: string) => void;
  clearSelection: () => void;
  addTask: (title: string, listId?: string) => void;
  updateTaskTitle: (taskId: string, title: string) => void;
  updateTaskDetails: (taskId: string, updates: Partial<Task>) => void;
  unscheduleTask: (taskId: string) => void;
  reorderTasks: (orderedIds: string[]) => void;
  updateTaskList: (taskId: string, listId: string) => void;
  scheduleTaskIds: (taskIds: string[]) => void;
  deleteTasks: (taskIds: string[]) => void;
  createList: (input: CreateListInput) => string;
  updateList: (listId: string, updates: UpdateListInput) => void;
  reorderLists: (orderedIds: string[]) => void;
}

const TaskTreeContext = createContext<TaskTreeState | null>(null);
const STORAGE_KEY = 'tasktree.local.v1';

interface PersistedTaskTreeState {
  lists: TaskList[];
  tasks: Task[];
}

function getTodayRepeatDay(): 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su' {
  return ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'][new Date().getDay()] as 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su';
}

function getTodayDayOfMonth() {
  return new Date().getDate();
}

function normalizeTask(task: Task): Task {
  const repeats = task.repeatConfig?.enabled ?? task.repeats ?? false;
  const notificationEnabled = task.notificationConfig?.enabled ?? task.notificationEnabled ?? false;
  const scheduledDate =
    task.type === 'task'
      ? task.scheduledDate ?? task.date
      : task.scheduledDate;

  return {
    ...task,
    scheduledDate,
    dueDate: task.dueDate,
    date: task.type === 'event' ? task.date ?? task.scheduledDate : task.date,
    repeatConfig: task.repeatConfig ?? {
      enabled: repeats,
      interval: 1,
      unit: 'day',
      daysOfWeek: [getTodayRepeatDay()],
      dayOfMonth: getTodayDayOfMonth(),
    },
    notificationConfig: task.notificationConfig ?? {
      enabled: notificationEnabled,
      offsetMinutes: 10,
    },
    repeats,
    notificationEnabled,
  };
}

function normalizeTasks(tasks: Task[]): Task[] {
  return tasks.map(normalizeTask);
}

function normalizeLists(lists: TaskList[]): TaskList[] {
  return lists
    .map((list, index) => ({
      ...list,
      defaultRepeats: list.defaultRepeats ?? false,
      defaultNotificationEnabled: list.defaultNotificationEnabled ?? false,
      sortOrder: typeof list.sortOrder === 'number' ? list.sortOrder : index,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function TaskTreeProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<TaskList[]>(mockLists);
  const [tasks, setTasks] = useState<Task[]>(normalizeTasks(mockTasks));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPersistedState() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!isMounted) return;

        if (!raw) {
          setLists(normalizeLists(mockLists));
          setTasks(normalizeTasks(mockTasks));
          setIsHydrated(true);
          return;
        }

        const parsed = JSON.parse(raw) as Partial<PersistedTaskTreeState>;
        const nextLists = Array.isArray(parsed.lists) ? normalizeLists(parsed.lists) : normalizeLists(mockLists);
        const nextTasks = Array.isArray(parsed.tasks) ? normalizeTasks(parsed.tasks) : normalizeTasks(mockTasks);

        setLists(nextLists);
        setTasks(nextTasks);
      } catch {
        if (!isMounted) return;
        setLists(normalizeLists(mockLists));
        setTasks(normalizeTasks(mockTasks));
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    }

    loadPersistedState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const payload: PersistedTaskTreeState = { lists, tasks };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {
      // Keep the app usable even if persistence fails.
    });
  }, [isHydrated, lists, tasks]);

  const toggleComplete = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              isCompleted: !t.isCompleted,
              completedAt: !t.isCompleted ? new Date().toISOString() : undefined,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  }, []);

  const toggleSelected = useCallback((taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const addTask = useCallback((title: string, listId?: string) => {
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const targetList = lists.find((l) => l.id === (listId ?? 'list-tasks'));
    const newTask: Task = {
      id: `task-${Date.now()}`,
      listId: listId ?? 'list-tasks',
      title,
      type: targetList?.behavior ?? 'task',
      isPriority: false,
      isCompleted: false,
      scheduledDate: targetList?.behavior === 'task' && !listId ? today : undefined,
      date: targetList?.behavior === 'event' ? today : undefined,
      isAllDay: targetList?.behavior === 'event',
      repeats: targetList?.defaultRepeats ?? false,
      notificationEnabled: targetList?.defaultNotificationEnabled ?? false,
      repeatConfig: {
        enabled: targetList?.defaultRepeats ?? false,
        interval: 1,
        unit: 'week',
      },
      notificationConfig: {
        enabled: targetList?.defaultNotificationEnabled ?? false,
        offsetMinutes: 10,
      },
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [...prev, normalizeTask(newTask)]);
  }, [lists]);

  const updateTaskTitle = useCallback((taskId: string, title: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, title, updatedAt: new Date().toISOString() }
          : t
      )
    );
  }, []);

  const updateTaskDetails = useCallback((taskId: string, updates: Partial<Task>) => {
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;

        const nextType = updates.type ?? task.type;
        let nextListId = updates.listId ?? task.listId;
        const targetList = lists.find((list) => list.id === nextListId);

        if (!updates.listId && targetList && targetList.behavior !== nextType) {
          const fallbackList = lists.find((list) => list.isSystem && list.behavior === nextType);
          if (fallbackList) nextListId = fallbackList.id;
        }

        const merged = normalizeTask({
          ...task,
          ...updates,
          listId: nextListId,
          type: nextType,
          repeats: updates.repeatConfig?.enabled ?? updates.repeats ?? task.repeats,
          notificationEnabled:
            updates.notificationConfig?.enabled ?? updates.notificationEnabled ?? task.notificationEnabled,
          updatedAt: now,
        });

        if (nextType === 'task') {
          const derivedDuration =
            merged.startTime && merged.endTime
              ? Math.max(15, ((parseInt(merged.endTime.slice(0, 2), 10) * 60 + parseInt(merged.endTime.slice(3), 10))
                - (parseInt(merged.startTime.slice(0, 2), 10) * 60 + parseInt(merged.startTime.slice(3), 10))) || 0)
              : merged.durationMinutes;

          return normalizeTask({
            ...merged,
            scheduledDate: merged.scheduledDate ?? merged.date,
            durationMinutes: derivedDuration,
            endTime: undefined,
            date: undefined,
            isAllDay: false,
          });
        }

        return normalizeTask({
          ...merged,
          date: merged.date ?? merged.scheduledDate,
          scheduledDate: undefined,
          timePreference: undefined,
          timePreferenceStart: undefined,
          timePreferenceEnd: undefined,
        });
      })
    );
  }, [lists]);

  const unscheduleTask = useCallback((taskId: string) => {
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              scheduledDate: undefined,
              date: task.type === 'event' ? undefined : task.date,
              startTime: undefined,
              endTime: undefined,
              isAllDay: false,
              updatedAt: now,
            }
          : task
      )
    );
  }, []);

  const reorderTasks = useCallback((orderedIds: string[]) => {
    setTasks((prev) => {
      const taskMap = new Map(prev.map((t) => [t.id, t]));
      const reordered: Task[] = [];
      const reorderedSet = new Set(orderedIds);
      // Build result: replace the block of reordered tasks in-place
      let inserted = false;
      for (const t of prev) {
        if (reorderedSet.has(t.id)) {
          if (!inserted) {
            for (const id of orderedIds) {
              const task = taskMap.get(id);
              if (task) reordered.push(task);
            }
            inserted = true;
          }
        } else {
          reordered.push(t);
        }
      }
      return reordered;
    });
  }, []);

  const updateTaskList = useCallback((taskId: string, listId: string) => {
    const targetList = lists.find((l) => l.id === listId);
    if (!targetList) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? normalizeTask({
              ...t,
              listId,
              type: targetList.behavior,
              scheduledDate:
                targetList.behavior === 'task'
                  ? t.scheduledDate ?? t.date
                  : undefined,
              date:
                targetList.behavior === 'event'
                  ? t.date ?? t.scheduledDate
                  : undefined,
              endTime: targetList.behavior === 'task' ? undefined : t.endTime,
              timePreference: targetList.behavior === 'event' ? undefined : t.timePreference,
              timePreferenceStart: targetList.behavior === 'event' ? undefined : t.timePreferenceStart,
              timePreferenceEnd: targetList.behavior === 'event' ? undefined : t.timePreferenceEnd,
              updatedAt: new Date().toISOString(),
            })
          : t
      )
    );
  }, [lists]);

  const scheduleTaskIds = useCallback((taskIds: string[]) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    const idSet = new Set(taskIds);
    setTasks((prev) =>
      prev.map((t) =>
        idSet.has(t.id)
          ? normalizeTask({
              ...t,
              scheduledDate: t.type === 'task' ? today : undefined,
              date: t.type === 'event' ? today : t.date,
              updatedAt: now,
            })
          : t
      )
    );
  }, []);

  const deleteTasks = useCallback((taskIds: string[]) => {
    const idSet = new Set(taskIds);
    setTasks((prev) => prev.filter((t) => !idSet.has(t.id)));
  }, []);

  const createList = useCallback((input: CreateListInput) => {
    const nextId = `list-${Date.now()}`;
    setLists((prev) => [
      ...prev,
      {
        id: nextId,
        isSystem: false,
        sortOrder: prev.length,
        ...input,
      },
    ]);
    return nextId;
  }, []);

  const updateList = useCallback((listId: string, updates: UpdateListInput) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, ...updates }
          : list
      )
    );
  }, []);

  const reorderLists = useCallback((orderedIds: string[]) => {
    setLists((prev) => {
      const listMap = new Map(prev.map((list) => [list.id, list]));
      const reordered = orderedIds
        .map((id, index) => {
          const list = listMap.get(id);
          return list ? { ...list, sortOrder: index } : null;
        })
        .filter((list): list is TaskList => list !== null);

      const remaining = prev
        .filter((list) => !orderedIds.includes(list.id))
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((list, index) => ({
          ...list,
          sortOrder: reordered.length + index,
        }));

      return [...reordered, ...remaining];
    });
  }, []);

  return React.createElement(
    TaskTreeContext.Provider,
    {
      value: {
        lists,
        tasks,
        selectedIds,
        isHydrated,
        toggleComplete,
        toggleSelected,
        clearSelection,
        addTask,
        updateTaskTitle,
        updateTaskDetails,
        unscheduleTask,
        reorderTasks,
        updateTaskList,
        scheduleTaskIds,
        deleteTasks,
        createList,
        updateList,
        reorderLists,
      },
    },
    children
  );
}

export function useTaskTree() {
  const ctx = useContext(TaskTreeContext);
  if (!ctx) throw new Error('useTaskTree must be used within TaskTreeProvider');
  return ctx;
}
