import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Task, TaskList } from './types';
import { mockTasks, mockLists } from './mockData';

interface TaskTreeState {
  lists: TaskList[];
  tasks: Task[];
  selectedIds: Set<string>;
  toggleComplete: (taskId: string) => void;
  toggleSelected: (taskId: string) => void;
  clearSelection: () => void;
  addTask: (title: string) => void;
  updateTaskTitle: (taskId: string, title: string) => void;
  reorderTasks: (orderedIds: string[]) => void;
  updateTaskList: (taskId: string, listId: string) => void;
  scheduleTaskIds: (taskIds: string[]) => void;
  deleteTasks: (taskIds: string[]) => void;
}

const TaskTreeContext = createContext<TaskTreeState | null>(null);

export function TaskTreeProvider({ children }: { children: ReactNode }) {
  const [lists] = useState<TaskList[]>(mockLists);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const addTask = useCallback((title: string) => {
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const newTask: Task = {
      id: `task-${Date.now()}`,
      listId: 'list-tasks',
      title,
      type: 'task',
      isPriority: false,
      isCompleted: false,
      date: today,
      isAllDay: false,
      repeats: false,
      notificationEnabled: false,
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [...prev, newTask]);
  }, []);

  const updateTaskTitle = useCallback((taskId: string, title: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, title, updatedAt: new Date().toISOString() }
          : t
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

  return React.createElement(
    TaskTreeContext.Provider,
    {
      value: {
        lists,
        tasks,
        selectedIds,
        toggleComplete,
        toggleSelected,
        clearSelection,
        addTask,
        updateTaskTitle,
        reorderTasks,
        updateTaskList,
        scheduleTaskIds,
        deleteTasks,
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
