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

  return React.createElement(
    TaskTreeContext.Provider,
    {
      value: { lists, tasks, selectedIds, toggleComplete, toggleSelected, clearSelection },
    },
    children
  );
}

export function useTaskTree() {
  const ctx = useContext(TaskTreeContext);
  if (!ctx) throw new Error('useTaskTree must be used within TaskTreeProvider');
  return ctx;
}
