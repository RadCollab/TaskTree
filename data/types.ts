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

export type IconShape =
  | 'circle' | 'square' | 'heart' | 'traingle' | 'star'
  | 'blob' | 'burst' | 'diamond' | 'pentagon' | 'hexagon' | 'bookmark';

export interface TaskList {
  id: string;
  name: string;
  color: string;
  icon: IconShape;
  behavior: 'task' | 'event';
  defaultRepeats: boolean;
  defaultNotificationEnabled: boolean;
  isSystem: boolean;
  sortOrder: number;
}
