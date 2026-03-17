export interface Task {
  id: string;
  listId: string;
  title: string;
  notes?: string;
  type: 'task' | 'event';
  isPriority: boolean;
  isCompleted: boolean;
  completedAt?: string;
  date?: string;
  startTime?: string;
  durationMinutes?: number;
  endTime?: string;
  isAllDay: boolean;
  repeats: boolean;
  notificationEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskList {
  id: string;
  name: string;
  color: string;
  icon: string;
  behavior: 'task' | 'event';
  isSystem: boolean;
  sortOrder: number;
}
