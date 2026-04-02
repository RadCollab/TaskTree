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
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
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
          setTasks(mockTasks);
          setIsHydrated(true);
          return;
        }

        const parsed = JSON.parse(raw) as Partial<PersistedTaskTreeState>;
        const nextLists = Array.isArray(parsed.lists) ? normalizeLists(parsed.lists) : normalizeLists(mockLists);
        const nextTasks = Array.isArray(parsed.tasks) ? parsed.tasks : mockTasks;

        setLists(nextLists);
        setTasks(nextTasks);
      } catch {
        if (!isMounted) return;
        setLists(normalizeLists(mockLists));
        setTasks(mockTasks);
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
      date: listId ? undefined : today,
      isAllDay: false,
      repeats: targetList?.defaultRepeats ?? false,
      notificationEnabled: targetList?.defaultNotificationEnabled ?? false,
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [...prev, newTask]);
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

  const unscheduleTask = useCallback((taskId: string) => {
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              date: undefined,
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
          ? { ...t, listId, type: targetList.behavior, updatedAt: new Date().toISOString() }
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
        idSet.has(t.id) ? { ...t, date: today, updatedAt: now } : t
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
