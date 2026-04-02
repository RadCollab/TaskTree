import { Task, TaskList } from './types';

export const mockLists: TaskList[] = [
  {
    id: 'list-tasks',
    name: 'Tasks',
    color: '#2e6d34',
    icon: 'circle',
    behavior: 'task',
    defaultRepeats: false,
    defaultNotificationEnabled: false,
    isSystem: true,
    sortOrder: 0,
  },
  {
    id: 'list-events',
    name: 'Events',
    color: '#492e97',
    icon: 'square',
    behavior: 'event',
    defaultRepeats: false,
    defaultNotificationEnabled: false,
    isSystem: true,
    sortOrder: 1,
  },
];

export const mockTasks: Task[] = [];
