export interface Task {
  id: string;
  listId: string;
  title: string;
  notes?: string;
  type: 'task' | 'event';
  isPriority: boolean;
  isCompleted: boolean;
  completedAt?: string;
  dueDate?: string;
  scheduledDate?: string;
  date?: string;
  startTime?: string;
  durationMinutes?: number;
  endTime?: string;
  timePreference?: 'custom' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'flexible';
  timePreferenceStart?: string;
  timePreferenceEnd?: string;
  repeatConfig?: {
    enabled: boolean;
    interval: number;
    unit: 'hour' | 'day' | 'week' | 'month';
    daysOfWeek?: Array<'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su'>;
    dayOfMonth?: number;
  };
  notificationConfig?: {
    enabled: boolean;
    offsetMinutes: number;
  };
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
