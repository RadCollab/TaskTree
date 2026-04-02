import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, shadows, spacing, typography } from '@/constants/theme';
import { DateIcon, TimeIcon, ToggleIcon } from '@/components/icons';
import { Task, TaskList } from '@/data/types';
import { TypeSelector } from './TypeSelector';

type SheetLayer =
  | 'date'
  | 'task-time'
  | 'custom-window'
  | 'event-start'
  | 'event-end'
  | 'duration'
  | 'frequency'
  | 'reminder'
  | null;

type DateTarget = 'dueDate' | 'date';

type RepeatUnit = 'hour' | 'day' | 'week' | 'month';
type TimePreference = NonNullable<Task['timePreference']>;
type RepeatDay = 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su';

interface TaskDraft {
  listId: string;
  title: string;
  type: Task['type'];
  dueDate?: string;
  scheduledDate?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  isAllDay: boolean;
  timePreference?: TimePreference;
  timePreferenceStart?: string;
  timePreferenceEnd?: string;
  repeatConfig: NonNullable<Task['repeatConfig']>;
  notificationConfig: NonNullable<Task['notificationConfig']>;
}

interface TimeSelectionDraft {
  preference?: TimePreference;
  start?: string;
}

interface TaskDetailsSheetProps {
  task: Task | null;
  lists: TaskList[];
  visible: boolean;
  onClose: () => void;
  onManageLists: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
}

const DURATION_OPTIONS = [5, 15, 30, 60];
const REMINDER_OPTIONS = [0, 5, 10, 15, 30, 60, 120, 1440];
const TIME_PREFERENCE_OPTIONS: Array<{ key: TimePreference; label: string }> = [
  { key: 'flexible', label: 'Flexible' },
  { key: 'morning', label: 'Morning' },
  { key: 'midday', label: 'Midday' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
  { key: 'custom', label: 'Custom' },
];
const WEEKDAY_OPTIONS: Array<{ key: RepeatDay; label: string; full: string }> = [
  { key: 'mo', label: 'Mo', full: 'Monday' },
  { key: 'tu', label: 'Tu', full: 'Tuesday' },
  { key: 'we', label: 'We', full: 'Wednesday' },
  { key: 'th', label: 'Th', full: 'Thursday' },
  { key: 'fr', label: 'Fr', full: 'Friday' },
  { key: 'sa', label: 'Sa', full: 'Saturday' },
  { key: 'su', label: 'Su', full: 'Sunday' },
];

function getTodayRepeatDay(): RepeatDay {
  return WEEKDAY_OPTIONS[(new Date().getDay() + 6) % 7]?.key ?? 'th';
}

function getTodayDayOfMonth() {
  return new Date().getDate();
}

function getRepeatUnitLabel(unit: RepeatUnit, interval: number) {
  if (interval === 1) {
    if (unit === 'hour') return 'Hourly';
    if (unit === 'day') return 'Daily';
    if (unit === 'week') return 'Weekly';
    return 'Monthly';
  }
  return `${unit[0].toUpperCase() + unit.slice(1)}s`;
}

function padNumber(value: number) {
  return value.toString().padStart(2, '0');
}

function formatLongDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatEventDate(value?: string) {
  if (!value) return 'Add Date';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'Add Date';
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  const monthDay = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${weekday}, ${monthDay}`;
}

function formatTime(value?: string) {
  if (!value) return undefined;
  const [rawHour, rawMinute] = value.split(':').map(Number);
  if (Number.isNaN(rawHour) || Number.isNaN(rawMinute)) return undefined;
  const period = rawHour >= 12 ? 'PM' : 'AM';
  const hour = rawHour % 12 || 12;
  return `${hour}:${padNumber(rawMinute)} ${period}`;
}

function formatDuration(minutes?: number) {
  if (!minutes) return 'Add Duration';
  if (minutes < 60) return `${minutes} min`;
  if (minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? '' : 's'}`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} hr ${remainder} min`;
}

function formatDurationCompact(minutes?: number) {
  if (!minutes) return 'Custom';
  if (minutes < 60) return `${minutes} min`;
  if (minutes % 60 === 0) return `${minutes / 60} hr`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h ${remainder}m`;
}

function formatReminder(offsetMinutes: number) {
  if (offsetMinutes === 0) return 'At time of event';
  if (offsetMinutes < 60) return `${offsetMinutes} minute${offsetMinutes === 1 ? '' : 's'} before`;
  if (offsetMinutes < 1440) {
    const hours = offsetMinutes / 60;
    return `${hours} hour${hours === 1 ? '' : 's'} before`;
  }
  const days = offsetMinutes / 1440;
  return `${days} day${days === 1 ? '' : 's'} before`;
}

function formatRepeatSummary(config: NonNullable<Task['repeatConfig']>) {
  if (!config.enabled) return 'Off';

  let summary =
    config.interval === 1
      ? getRepeatUnitLabel(config.unit, 1)
      : `Every ${config.interval} ${config.unit}s`;

  if (config.unit === 'week' && config.daysOfWeek?.length) {
    const labels = WEEKDAY_OPTIONS
      .filter((option) => config.daysOfWeek?.includes(option.key))
      .map((option) => option.full);
    if (labels.length === 1) {
      summary += ` on ${labels[0]}`;
    } else if (labels.length === 2) {
      summary += ` on ${labels[0]} and ${labels[1]}`;
    } else if (labels.length > 2) {
      summary += ` on ${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
    }
  }

  if (config.unit === 'month' && config.dayOfMonth) {
    summary += ` on day ${config.dayOfMonth}`;
  }

  return summary;
}

function buildDraft(task: Task): TaskDraft {
  return {
    listId: task.listId,
    title: task.title,
    type: task.type,
    dueDate: task.dueDate,
    scheduledDate: task.scheduledDate,
    date: task.date,
    startTime: task.startTime,
    endTime: task.endTime,
    durationMinutes: task.durationMinutes,
    isAllDay: task.isAllDay,
    timePreference: task.timePreference,
    timePreferenceStart: task.timePreferenceStart,
    timePreferenceEnd: task.timePreferenceEnd,
    repeatConfig: task.repeatConfig ?? {
      enabled: task.repeats,
      interval: 1,
      unit: 'day',
      daysOfWeek: [getTodayRepeatDay()],
      dayOfMonth: getTodayDayOfMonth(),
    },
    notificationConfig: task.notificationConfig ?? {
      enabled: task.notificationEnabled,
      offsetMinutes: 10,
    },
  };
}

function createTimeParts(value?: string) {
  const [hours = 9, minutes = 0] = value?.split(':').map(Number) ?? [];
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return {
    hour: padNumber(displayHour),
    minute: padNumber(minutes),
    period,
  };
}

function toTwentyFourHour(hour: string, minute: string, period: string) {
  const parsedHour = Number(hour);
  const parsedMinute = Number(minute);
  if (
    Number.isNaN(parsedHour) ||
    Number.isNaN(parsedMinute) ||
    parsedHour < 1 ||
    parsedHour > 12 ||
    parsedMinute < 0 ||
    parsedMinute > 59
  ) {
    return undefined;
  }

  let hours24 = parsedHour % 12;
  if (period === 'PM') hours24 += 12;
  return `${padNumber(hours24)}:${padNumber(parsedMinute)}`;
}

function getAutoPeriodForHour(displayHour: number) {
  if (displayHour >= 7 && displayHour <= 11) return 'AM';
  return 'PM';
}

function addMinutesToTime(value: string, minutesToAdd: number) {
  const minutes = getMinutes(value);
  if (minutes === undefined) return undefined;
  const next = (minutes + minutesToAdd + 24 * 60) % (24 * 60);
  const hours = Math.floor(next / 60);
  const remainder = next % 60;
  return `${padNumber(hours)}:${padNumber(remainder)}`;
}

function addDays(value: string | undefined, amount: number) {
  const base = value ? new Date(`${value}T12:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) return value;
  base.setDate(base.getDate() + amount);
  return `${base.getFullYear()}-${padNumber(base.getMonth() + 1)}-${padNumber(base.getDate())}`;
}

function createDate(value?: string) {
  const base = value ? new Date(`${value}T12:00:00`) : new Date();
  return Number.isNaN(base.getTime()) ? new Date() : base;
}

function startOfMonth(value?: string) {
  const base = createDate(value);
  return new Date(base.getFullYear(), base.getMonth(), 1, 12);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

function buildCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ key: string; label: string; value?: string }> = [];

  for (let index = 0; index < firstDayIndex; index += 1) {
    cells.push({ key: `empty-${index}`, label: '' });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const value = `${year}-${padNumber(month + 1)}-${padNumber(day)}`;
    cells.push({ key: value, label: `${day}`, value });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `tail-${cells.length}`, label: '' });
  }

  return cells;
}

function getMinutes(value?: string) {
  if (!value) return undefined;
  const [hour, minute] = value.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return undefined;
  return hour * 60 + minute;
}

function Toggle({
  value,
  onToggle,
}: {
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      style={[styles.toggle, value && styles.toggleActive]}
      onPress={onToggle}
    >
      <View style={[styles.toggleKnob, value && styles.toggleKnobActive]} />
    </Pressable>
  );
}

function SheetLayerModal({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.backdrop} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.overlaySheet}>
          <View style={styles.overlayHeader}>
            <Text style={styles.overlayTitle}>{title}</Text>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

export function TaskDetailsSheet({
  task,
  lists,
  visible,
  onClose,
  onManageLists,
  onSave,
}: TaskDetailsSheetProps) {
  const [draft, setDraft] = useState<TaskDraft | null>(null);
  const [activeLayer, setActiveLayer] = useState<SheetLayer>(null);
  const [dateTarget, setDateTarget] = useState<DateTarget>('dueDate');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | undefined>(undefined);
  const [displayedMonth, setDisplayedMonth] = useState(() => startOfMonth());
  const [timeFields, setTimeFields] = useState(createTimeParts());
  const [windowStartFields, setWindowStartFields] = useState(createTimeParts('09:00'));
  const [pendingTimeSelection, setPendingTimeSelection] = useState<TimeSelectionDraft>({});
  const [pendingRepeatConfig, setPendingRepeatConfig] = useState<NonNullable<Task['repeatConfig']>>({
    enabled: false,
    interval: 1,
    unit: 'week',
  });
  const [pendingNotificationConfig, setPendingNotificationConfig] = useState<NonNullable<Task['notificationConfig']>>({
    enabled: false,
    offsetMinutes: 10,
  });
  const [customClockMode, setCustomClockMode] = useState<'hour' | 'minute'>('hour');
  const [customDuration, setCustomDuration] = useState(75);
  const [durationTrackWidth, setDurationTrackWidth] = useState(0);
  const sheetTranslateY = useState(() => new Animated.Value(420))[0];
  const backdropOpacity = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (!visible || !task) return;
    setDraft(buildDraft(task));
    setCustomDuration(task.durationMinutes ?? 75);
    setPendingTimeSelection({
      preference: task.timePreference,
      start: task.timePreferenceStart,
    });
    setActiveLayer(null);
  }, [task, visible]);

  useEffect(() => {
    if (!visible) {
      sheetTranslateY.setValue(420);
      backdropOpacity.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, sheetTranslateY, visible]);

  const isValid = useMemo(() => {
    if (!draft) return false;
    if (!draft.title.trim()) return false;
    if (draft.type === 'event') {
      if (!draft.date) return false;
      if (!draft.isAllDay && (!draft.startTime || !draft.endTime)) return false;
      const startMinutes = getMinutes(draft.startTime);
      const endMinutes = getMinutes(draft.endTime);
      if (!draft.isAllDay && startMinutes !== undefined && endMinutes !== undefined && endMinutes <= startMinutes) {
        return false;
      }
    }
    if (
      draft.type === 'task' &&
      draft.timePreference === 'custom' &&
      !draft.timePreferenceStart
    ) {
      return false;
    }
    return true;
  }, [draft]);

  if (!task || !draft) return null;

  const isCustomDurationSelected = !!draft.durationMinutes && !DURATION_OPTIONS.includes(draft.durationMinutes);
  const updateCustomDurationFromPosition = (locationX: number) => {
    if (!durationTrackWidth) return;
    const clamped = Math.min(durationTrackWidth, Math.max(0, locationX));
    const ratio = clamped / durationTrackWidth;
    const value = 5 + Math.round((ratio * (180 - 5)) / 5) * 5;
    setCustomDuration(value);
  };

  const durationPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      updateCustomDurationFromPosition(event.nativeEvent.locationX);
    },
    onPanResponderMove: (event) => {
      updateCustomDurationFromPosition(event.nativeEvent.locationX);
    },
  });

  const durationRatio = (customDuration - 5) / (180 - 5);
  const durationThumbOffset = durationTrackWidth > 0 ? durationRatio * durationTrackWidth : 0;
  const calendarDays = buildCalendarDays(displayedMonth);
  const calendarMonthLabel = displayedMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const openDateLayer = (target: DateTarget) => {
    setDateTarget(target);
    const nextValue = target === 'dueDate' ? draft.dueDate : draft.date;
    setSelectedCalendarDate(nextValue);
    setDisplayedMonth(startOfMonth(nextValue));
    setActiveLayer('date');
  };

  const openSingleTimeLayer = (target: 'event-start' | 'event-end') => {
    setTimeFields(createTimeParts(target === 'event-start' ? draft.startTime : draft.endTime));
    setCustomClockMode('hour');
    setActiveLayer(target);
  };

  const openTaskTimeLayer = () => {
    setPendingTimeSelection({
      preference: draft.timePreference ?? 'flexible',
      start: draft.timePreferenceStart,
    });
    setActiveLayer('task-time');
  };

  const openCustomWindowLayer = () => {
    setWindowStartFields(createTimeParts(pendingTimeSelection.start ?? '09:00'));
    setCustomClockMode('hour');
    setActiveLayer('custom-window');
  };

  const openFrequencyLayer = () => {
    setPendingRepeatConfig({
      ...draft.repeatConfig,
      interval: draft.repeatConfig.interval ?? 1,
      unit: draft.repeatConfig.unit ?? 'day',
      daysOfWeek: draft.repeatConfig.daysOfWeek?.length ? draft.repeatConfig.daysOfWeek : [getTodayRepeatDay()],
      dayOfMonth: draft.repeatConfig.dayOfMonth ?? getTodayDayOfMonth(),
    });
    setActiveLayer('frequency');
  };

  const openReminderLayer = () => {
    setPendingNotificationConfig(draft.notificationConfig);
    setActiveLayer('reminder');
  };

  const handleClose = () => {
    setActiveLayer(null);
    onClose();
  };

  const handleSave = () => {
    if (!isValid) return;

    const updates: Partial<Task> = {
      listId: draft.listId,
      title: draft.title.trim(),
      type: draft.type,
      dueDate: draft.type === 'task' ? draft.dueDate : undefined,
      scheduledDate: draft.type === 'task' ? draft.scheduledDate ?? task.scheduledDate : undefined,
      date: draft.type === 'event' ? draft.date : undefined,
      startTime: draft.type === 'event' && !draft.isAllDay ? draft.startTime : undefined,
      endTime: draft.type === 'event' && !draft.isAllDay ? draft.endTime : undefined,
      durationMinutes: draft.type === 'task' ? draft.durationMinutes : undefined,
      isAllDay: draft.type === 'event' ? draft.isAllDay : false,
      timePreference: draft.type === 'task' ? draft.timePreference : undefined,
      timePreferenceStart: draft.type === 'task' ? draft.timePreferenceStart : undefined,
      timePreferenceEnd: undefined,
      repeatConfig: draft.repeatConfig,
      repeats: draft.repeatConfig.enabled,
      notificationConfig: draft.notificationConfig,
      notificationEnabled: draft.notificationConfig.enabled,
    };

    onSave(task.id, updates);
    handleClose();
  };

  const timeSummary = (() => {
    if (!draft.timePreference || draft.timePreference === 'flexible') return 'Add Time';
    if (draft.timePreference === 'custom') {
      return formatTime(draft.timePreferenceStart) ?? 'Add Time';
    }
    return TIME_PREFERENCE_OPTIONS.find((option) => option.key === draft.timePreference)?.label ?? 'Add Time';
  })();

  const stagedTimeSummary = (() => {
    if (!pendingTimeSelection.preference || pendingTimeSelection.preference === 'flexible') return 'Add Time';
    if (pendingTimeSelection.preference === 'custom') {
      return formatTime(pendingTimeSelection.start) ?? 'Add Time';
    }
    return TIME_PREFERENCE_OPTIONS.find((option) => option.key === pendingTimeSelection.preference)?.label ?? 'Add Time';
  })();

  const dialOptions = customClockMode === 'hour'
    ? ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
    : ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  const setClockValue = (value: string) => {
    setWindowStartFields((current) =>
      customClockMode === 'hour'
        ? {
            ...current,
            hour: padNumber(Number(value) || 12),
            period: getAutoPeriodForHour(Number(value) || 12),
          }
        : { ...current, minute: padNumber(Number(value)) }
    );
    if (customClockMode === 'hour') {
      setCustomClockMode('minute');
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          </Animated.View>
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
            <View style={styles.handle} />
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <View style={styles.titleCard}>
                <TextInput
                  style={styles.titleInput}
                  value={draft.title}
                  onChangeText={(title) => setDraft((current) => (current ? { ...current, title } : current))}
                  placeholder={draft.type === 'event' ? 'This is the event name' : 'This is the task name'}
                  placeholderTextColor={colors.borderDk}
                />
              </View>

              <View style={styles.segmentedCard}>
                <TypeSelector
                  lists={lists}
                  currentListId={draft.listId}
                  onSelect={(listId) => {
                    const selectedList = lists.find((list) => list.id === listId);
                    if (!selectedList) return;
                    setDraft((current) => current
                      ? {
                          ...current,
                          listId,
                          type: selectedList.behavior,
                          scheduledDate:
                            selectedList.behavior === 'task'
                              ? current.scheduledDate ?? task.scheduledDate ?? current.date
                              : undefined,
                          date:
                            selectedList.behavior === 'event'
                              ? current.date ?? current.scheduledDate ?? task.date ?? task.scheduledDate
                              : current.date,
                          isAllDay: selectedList.behavior === 'task' ? false : current.isAllDay,
                        }
                      : current);
                  }}
                  onManage={() => {
                    onClose();
                    onManageLists();
                  }}
                />
              </View>

              {draft.type === 'task' ? (
                <View style={styles.propertyCard}>
                  <View style={styles.topPropertySurface}>
                    <View style={styles.topPropertyRow}>
                    <Pressable style={styles.topPropertyHalf} onPress={() => openDateLayer('dueDate')}>
                      <View style={styles.propertyIconWrap}>
                        <DateIcon size={12} color={colors.content} />
                      </View>
                      <Text style={[styles.propertyValueInline, !draft.dueDate && styles.propertyLink]}>
                        {draft.dueDate ? `Due: ${formatLongDate(draft.dueDate)}` : 'Due Date'}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.topPropertyHalf, styles.topPropertyHalfBorder]}
                      onPress={openTaskTimeLayer}
                    >
                      <View style={styles.propertyIconWrap}>
                        <TimeIcon size={12} color={colors.content} />
                      </View>
                      <Text style={styles.propertyLink}>{timeSummary}</Text>
                    </Pressable>
                  </View>
                  </View>

                  <View style={styles.settingsSurface}>
                    <Text style={styles.sectionLabel}>Duration</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.durationRow}
                    >
                      {DURATION_OPTIONS.map((minutes) => {
                        const isSelected = draft.durationMinutes === minutes;
                        return (
                          <Pressable
                            key={minutes}
                            style={[styles.durationChip, isSelected && styles.durationChipSelected]}
                            onPress={() =>
                              setDraft((current) =>
                                current
                                  ? { ...current, durationMinutes: isSelected ? undefined : minutes }
                                  : current
                              )
                            }
                          >
                            <Text style={[styles.durationChipText, isSelected && styles.durationChipTextSelected]}>
                              {formatDuration(minutes)}
                            </Text>
                          </Pressable>
                        );
                      })}
                      <Pressable
                        style={[styles.durationChip, isCustomDurationSelected && styles.durationChipSelected]}
                        onPress={() => {
                          if (isCustomDurationSelected) {
                            setDraft((current) => current ? { ...current, durationMinutes: undefined } : current);
                            return;
                          }
                          setCustomDuration(draft.durationMinutes ?? customDuration);
                          setActiveLayer('duration');
                        }}
                      >
                        <Text style={[styles.durationChipText, isCustomDurationSelected && styles.durationChipTextSelected]}>
                          ... {isCustomDurationSelected ? formatDurationCompact(draft.durationMinutes) : 'Custom'}
                        </Text>
                      </Pressable>
                    </ScrollView>

                    <View style={styles.rowDivider} />

                  <View style={styles.toggleRow}>
                    <Pressable
                      style={styles.toggleRowLeft}
                      onPress={openFrequencyLayer}
                    >
                      <Toggle
                        value={draft.repeatConfig.enabled}
                        onToggle={openFrequencyLayer}
                      />
                      <Text style={styles.toggleRowText}>Repeats</Text>
                    </Pressable>
                      <Pressable style={styles.toggleMetaButton} onPress={openFrequencyLayer}>
                      <Text style={styles.toggleMeta}>
                        {formatRepeatSummary(draft.repeatConfig)}
                      </Text>
                    </Pressable>
                    </View>

                    <View style={styles.rowDivider} />

                  <View style={styles.toggleRow}>
                    <Pressable
                      style={styles.toggleRowLeft}
                      onPress={openReminderLayer}
                    >
                      <Toggle
                        value={draft.notificationConfig.enabled}
                        onToggle={openReminderLayer}
                      />
                      <Text style={styles.toggleRowText}>Notification</Text>
                    </Pressable>
                    <Pressable style={styles.toggleMetaButton} onPress={openReminderLayer}>
                        <Text style={styles.toggleMeta}>
                          {draft.notificationConfig.enabled ? formatReminder(draft.notificationConfig.offsetMinutes) : 'Off'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.propertyCard}>
                  <View style={styles.topPropertySurface}>
                    <View style={styles.eventHeaderRow}>
                      <Pressable style={styles.eventDateButton} onPress={() => openDateLayer('date')}>
                        <View style={styles.eventDateContent}>
                          <View style={styles.propertyIconWrap}>
                            <DateIcon size={12} color={colors.content} />
                          </View>
                          <Text style={styles.propertyLabelStrong}>{formatEventDate(draft.date)}</Text>
                        </View>
                      </Pressable>
                      <View style={styles.eventToggleWrap}>
                        <Toggle
                          value={draft.isAllDay}
                          onToggle={() =>
                            setDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    isAllDay: !current.isAllDay,
                                    startTime: !current.isAllDay ? undefined : current.startTime,
                                    endTime: !current.isAllDay ? undefined : current.endTime,
                                  }
                                : current
                            )
                          }
                        />
                        <Text style={styles.eventToggleText}>All Day</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.settingsSurface}>
                    {!draft.isAllDay && (
                      <View style={styles.eventTimeRow}>
                        <Pressable style={styles.eventTimeButton} onPress={() => openSingleTimeLayer('event-start')}>
                          <Text style={styles.eventTimeButtonText}>{formatTime(draft.startTime) ?? 'Start'}</Text>
                        </Pressable>
                        <Text style={styles.eventTimeBetween}>to</Text>
                        <Pressable style={styles.eventTimeButton} onPress={() => openSingleTimeLayer('event-end')}>
                          <Text style={styles.eventTimeButtonText}>{formatTime(draft.endTime) ?? 'End'}</Text>
                        </Pressable>
                      </View>
                    )}

                    {!draft.isAllDay && <View style={styles.rowDivider} />}

                  <View style={styles.toggleRow}>
                    <Pressable
                      style={styles.toggleRowLeft}
                      onPress={openFrequencyLayer}
                    >
                      <Toggle
                        value={draft.repeatConfig.enabled}
                        onToggle={openFrequencyLayer}
                      />
                      <Text style={styles.toggleRowText}>Repeats</Text>
                    </Pressable>
                      <Pressable style={styles.toggleMetaButton} onPress={openFrequencyLayer}>
                      <Text style={styles.toggleMeta}>
                          {formatRepeatSummary(draft.repeatConfig)}
                      </Text>
                    </Pressable>
                    </View>

                    <View style={styles.rowDivider} />

                  <View style={styles.toggleRow}>
                    <Pressable
                      style={styles.toggleRowLeft}
                      onPress={openReminderLayer}
                    >
                      <Toggle
                        value={draft.notificationConfig.enabled}
                        onToggle={openReminderLayer}
                      />
                      <Text style={styles.toggleRowText}>Notification</Text>
                    </Pressable>
                    <Pressable style={styles.toggleMetaButton} onPress={openReminderLayer}>
                        <Text style={styles.toggleMeta}>
                          {draft.notificationConfig.enabled ? formatReminder(draft.notificationConfig.offsetMinutes) : 'Off'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.footer}>
                <Pressable style={styles.cancelButton} onPress={handleClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={!isValid}
                >
                  <Text style={[styles.saveButtonText, !isValid && styles.saveButtonTextDisabled]}>Save</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <SheetLayerModal
        visible={activeLayer === 'date'}
        title={dateTarget === 'dueDate' ? 'Due Date' : 'Date'}
        onClose={() => setActiveLayer(null)}
      >
        <View style={styles.overlayBody}>
          <View style={styles.quickRow}>
            {[
              { label: 'Today', value: addDays(undefined, 0) },
              { label: 'Tomorrow', value: addDays(undefined, 1) },
              { label: 'Next Week', value: addDays(undefined, 7) },
            ].map((option) => (
              <Pressable
                key={option.label}
                style={[
                  styles.calendarQuickChip,
                  selectedCalendarDate === option.value && styles.calendarQuickChipSelected,
                ]}
                onPress={() => {
                  setSelectedCalendarDate(option.value);
                  setDisplayedMonth(startOfMonth(option.value));
                }}
              >
                <Text
                  style={[
                    styles.calendarQuickChipText,
                    selectedCalendarDate === option.value && styles.calendarQuickChipTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarMonthLabel}>{calendarMonthLabel}</Text>
              <View style={styles.calendarNavRow}>
                <Pressable
                  style={styles.calendarNavButton}
                  onPress={() => setDisplayedMonth((current) => addMonths(current, -1))}
                >
                  <View style={styles.calendarNavIconFlipped}>
                    <ToggleIcon size={14} color={colors.content} />
                  </View>
                </Pressable>
                <Pressable
                  style={styles.calendarNavButton}
                  onPress={() => setDisplayedMonth((current) => addMonths(current, 1))}
                >
                  <ToggleIcon size={14} color={colors.content} />
                </Pressable>
              </View>
            </View>
            <View style={styles.calendarWeekRow}>
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((label) => (
                <Text key={label} style={styles.calendarWeekday}>
                  {label}
                </Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarDays.map((day) => {
                const isSelected = selectedCalendarDate === day.value;
                return (
                  <Pressable
                    key={day.key}
                    style={styles.calendarCell}
                    disabled={!day.value}
                    onPress={() => setSelectedCalendarDate(day.value)}
                  >
                    {day.value ? (
                      <View style={[styles.calendarDayCircle, isSelected && styles.calendarDayCircleSelected]}>
                        <Text style={[styles.calendarDayLabel, isSelected && styles.calendarDayLabelSelected]}>
                          {day.label}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.calendarDayCircle} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={styles.overlayFooter}>
            <Pressable style={styles.cancelButton} onPress={() => setActiveLayer(null)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.saveButton, !selectedCalendarDate && styles.saveButtonDisabled]}
              disabled={!selectedCalendarDate}
              onPress={() => {
                const nextValue = selectedCalendarDate;
                if (!nextValue) return;
                setDraft((current) =>
                  current
                    ? { ...current, [dateTarget]: nextValue }
                    : current
                );
                setActiveLayer(null);
              }}
            >
              <Text style={[styles.saveButtonText, !selectedCalendarDate && styles.saveButtonTextDisabled]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </SheetLayerModal>

      <SheetLayerModal
        visible={activeLayer === 'task-time'}
        title="Start Time"
        onClose={() => setActiveLayer(null)}
      >
        <View style={styles.overlayBody}>
              <Text style={styles.overlaySubtitle}>Use ranges to help with auto-scheduling</Text>
          <View style={styles.choiceGrid}>
            {TIME_PREFERENCE_OPTIONS.map((option) => {
              const isSelected = pendingTimeSelection.preference === option.key;
              const optionLabel =
                option.key === 'custom' && pendingTimeSelection.start
                  ? formatTime(pendingTimeSelection.start) ?? option.label
                  : option.label;
              return (
                <Pressable
                  key={option.key}
                  style={[styles.choiceChip, isSelected && styles.choiceChipSelected]}
                  onPress={() => {
                    if (option.key === 'custom') {
                      setPendingTimeSelection((current) => ({
                        preference: 'custom',
                        start: current.start,
                      }));
                      openCustomWindowLayer();
                      return;
                    }
                    setPendingTimeSelection({
                      preference: option.key,
                      start: undefined,
                    });
                  }}
                >
                  <Text style={[styles.choiceChipText, isSelected && styles.choiceChipTextSelected]}>
                    {optionLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.overlayFooter}>
            <Pressable style={styles.cancelButton} onPress={() => setActiveLayer(null)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.saveButton}
              onPress={() => {
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        timePreference: pendingTimeSelection.preference,
                        timePreferenceStart: pendingTimeSelection.preference === 'custom' ? pendingTimeSelection.start : undefined,
                        timePreferenceEnd: undefined,
                      }
                    : current
                );
                setActiveLayer(null);
              }}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </SheetLayerModal>

      <SheetLayerModal
        visible={activeLayer === 'custom-window'}
        title="Custom Time"
        onClose={() => {
          setActiveLayer('task-time');
        }}
      >
        <View style={styles.overlayBody}>
          <View style={styles.materialPickerCard}>
            <View style={styles.materialDisplayRow}>
              <Pressable
                style={styles.materialDisplayBlock}
                onPress={() => setCustomClockMode('hour')}
              >
                <Text style={[styles.materialDisplayText, customClockMode === 'hour' && styles.materialDisplayTextActive]}>
                  {windowStartFields.hour}
                </Text>
              </Pressable>
              <Text style={styles.materialDisplayColon}>:</Text>
              <Pressable
                style={styles.materialDisplayBlock}
                onPress={() => setCustomClockMode('minute')}
              >
                <Text style={[styles.materialDisplayText, customClockMode === 'minute' && styles.materialDisplayTextActive]}>
                  {windowStartFields.minute}
                </Text>
              </Pressable>
              <View style={styles.periodColumn}>
                {['AM', 'PM'].map((period) => (
                  <Pressable
                    key={period}
                    style={[styles.periodButton, windowStartFields.period === period && styles.periodButtonActive]}
                    onPress={() => {
                      setWindowStartFields((current) => ({ ...current, period }));
                    }}
                  >
                    <Text style={[styles.periodButtonText, windowStartFields.period === period && styles.periodButtonTextActive]}>
                      {period}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.materialModeRow}>
              <Pressable
                style={[styles.materialModeChip, customClockMode === 'hour' && styles.materialModeChipActive]}
                onPress={() => setCustomClockMode('hour')}
              >
                <Text style={[styles.materialModeChipText, customClockMode === 'hour' && styles.materialModeChipTextActive]}>
                  Hour
                </Text>
              </Pressable>
              <Pressable
                style={[styles.materialModeChip, customClockMode === 'minute' && styles.materialModeChipActive]}
                onPress={() => setCustomClockMode('minute')}
              >
                <Text style={[styles.materialModeChipText, customClockMode === 'minute' && styles.materialModeChipTextActive]}>
                  Minute
                </Text>
              </Pressable>
            </View>
            <View style={styles.clockFace}>
              {dialOptions.map((option, index) => {
                const angle = ((index * 30) - 90) * (Math.PI / 180);
                const radius = 96;
                const center = 118;
                const x = center + Math.cos(angle) * radius;
                const y = center + Math.sin(angle) * radius;
                const isSelected =
                  customClockMode === 'hour'
                    ? `${Number(windowStartFields.hour) || 12}` === `${Number(option) || 12}`
                    : windowStartFields.minute === padNumber(Number(option));

                return (
                  <Pressable
                    key={option}
                    style={[
                      styles.clockNumber,
                      { left: x - 18, top: y - 18 },
                      isSelected && styles.clockNumberSelected,
                    ]}
                    onPress={() => setClockValue(option)}
                  >
                    <Text style={[styles.clockNumberText, isSelected && styles.clockNumberTextSelected]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
              <View style={styles.clockCenterDot} />
            </View>
          </View>
          <View style={styles.overlayFooter}>
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                setWindowStartFields(createTimeParts(pendingTimeSelection.start ?? '09:00'));
                setActiveLayer('task-time');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.saveButton,
                !toTwentyFourHour(windowStartFields.hour, windowStartFields.minute, windowStartFields.period) &&
                  styles.saveButtonDisabled,
              ]}
              onPress={() => {
                const start = toTwentyFourHour(windowStartFields.hour, windowStartFields.minute, windowStartFields.period);
                if (!start) return;
                setPendingTimeSelection({
                  preference: 'custom',
                  start,
                });
                setActiveLayer('task-time');
              }}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </SheetLayerModal>

      <SheetLayerModal
        visible={activeLayer === 'event-start' || activeLayer === 'event-end'}
        title={activeLayer === 'event-start' ? 'Start Time' : 'End Time'}
        onClose={() => setActiveLayer(null)}
      >
        <View style={styles.overlayBody}>
          <View style={styles.materialPickerCard}>
            <View style={styles.materialDisplayRow}>
              <Pressable
                style={styles.materialDisplayBlock}
                onPress={() => setCustomClockMode('hour')}
              >
                <Text style={[styles.materialDisplayText, customClockMode === 'hour' && styles.materialDisplayTextActive]}>
                  {timeFields.hour}
                </Text>
              </Pressable>
              <Text style={styles.materialDisplayColon}>:</Text>
              <Pressable
                style={styles.materialDisplayBlock}
                onPress={() => setCustomClockMode('minute')}
              >
                <Text style={[styles.materialDisplayText, customClockMode === 'minute' && styles.materialDisplayTextActive]}>
                  {timeFields.minute}
                </Text>
              </Pressable>
              <View style={styles.periodColumn}>
                {['AM', 'PM'].map((period) => (
                  <Pressable
                    key={period}
                    style={[styles.periodButton, timeFields.period === period && styles.periodButtonActive]}
                    onPress={() => setTimeFields((current) => ({ ...current, period }))}
                  >
                    <Text style={[styles.periodButtonText, timeFields.period === period && styles.periodButtonTextActive]}>
                      {period}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.materialModeRow}>
              <Pressable
                style={[styles.materialModeChip, customClockMode === 'hour' && styles.materialModeChipActive]}
                onPress={() => setCustomClockMode('hour')}
              >
                <Text style={[styles.materialModeChipText, customClockMode === 'hour' && styles.materialModeChipTextActive]}>
                  Hour
                </Text>
              </Pressable>
              <Pressable
                style={[styles.materialModeChip, customClockMode === 'minute' && styles.materialModeChipActive]}
                onPress={() => setCustomClockMode('minute')}
              >
                <Text style={[styles.materialModeChipText, customClockMode === 'minute' && styles.materialModeChipTextActive]}>
                  Minute
                </Text>
              </Pressable>
            </View>
            <View style={styles.clockFace}>
              {dialOptions.map((option, index) => {
                const angle = ((index * 30) - 90) * (Math.PI / 180);
                const radius = 96;
                const center = 118;
                const x = center + Math.cos(angle) * radius;
                const y = center + Math.sin(angle) * radius;
                const isSelected =
                  customClockMode === 'hour'
                    ? `${Number(timeFields.hour) || 12}` === `${Number(option) || 12}`
                    : timeFields.minute === padNumber(Number(option));

                return (
                  <Pressable
                    key={option}
                    style={[
                      styles.clockNumber,
                      { left: x - 18, top: y - 18 },
                      isSelected && styles.clockNumberSelected,
                    ]}
                    onPress={() => {
                      setTimeFields((current) =>
                        customClockMode === 'hour'
                          ? {
                              ...current,
                              hour: padNumber(Number(option) || 12),
                              period: getAutoPeriodForHour(Number(option) || 12),
                            }
                          : { ...current, minute: padNumber(Number(option)) }
                      );
                      if (customClockMode === 'hour') {
                        setCustomClockMode('minute');
                      }
                    }}
                  >
                    <Text style={[styles.clockNumberText, isSelected && styles.clockNumberTextSelected]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
              <View style={styles.clockCenterDot} />
            </View>
          </View>
          <View style={styles.overlayFooter}>
            <Pressable style={styles.cancelButton} onPress={() => setActiveLayer(null)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.saveButton,
                !toTwentyFourHour(timeFields.hour, timeFields.minute, timeFields.period) && styles.saveButtonDisabled,
              ]}
              onPress={() => {
                const nextValue = toTwentyFourHour(timeFields.hour, timeFields.minute, timeFields.period);
                if (!nextValue) return;
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        [activeLayer === 'event-start' ? 'startTime' : 'endTime']: nextValue,
                        ...(activeLayer === 'event-start' ? { endTime: addMinutesToTime(nextValue, 30) } : {}),
                      }
                    : current
                );
                setActiveLayer(null);
              }}
            >
              <Text style={[styles.saveButtonText, !toTwentyFourHour(timeFields.hour, timeFields.minute, timeFields.period) && styles.saveButtonTextDisabled]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </SheetLayerModal>

      <SheetLayerModal
        visible={activeLayer === 'duration'}
        title="Custom Duration"
        onClose={() => setActiveLayer(null)}
      >
        <View style={styles.overlayBody}>
          <View style={styles.overlayCard}>
            <Text style={styles.customDurationValue}>{formatDuration(customDuration)}</Text>
            <View style={styles.durationBoundsRow}>
              <Text style={styles.durationBoundText}>5 min</Text>
              <Text style={styles.durationBoundText}>3 hr</Text>
            </View>
            <View
              style={styles.durationSliderArea}
              onLayout={(event) => setDurationTrackWidth(event.nativeEvent.layout.width)}
              {...durationPanResponder.panHandlers}
            >
              <View style={styles.durationSliderTrack} />
              <View style={[styles.durationSliderFill, { width: durationThumbOffset }]} />
              <View
                style={[
                  styles.durationSliderThumb,
                  { transform: [{ translateX: Math.max(0, durationThumbOffset - 14) }] },
                ]}
              />
            </View>
            <View style={styles.durationStepRow}>
              <Pressable
                style={styles.stepperField}
                onPress={() => setCustomDuration((current) => Math.max(5, current - 5))}
              >
                <Text style={styles.stepperFieldText}>-</Text>
              </Pressable>
              <View style={styles.intervalValue}>
                <Text style={styles.intervalValueText}>{customDuration} min</Text>
              </View>
              <Pressable
                style={styles.stepperField}
                onPress={() => setCustomDuration((current) => Math.min(180, current + 5))}
              >
                <Text style={styles.stepperFieldText}>+</Text>
              </Pressable>
            </View>
            <View style={styles.overlayFooter}>
              <Pressable style={styles.cancelButton} onPress={() => setActiveLayer(null)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.saveButton}
                onPress={() => {
                  setDraft((current) => current ? { ...current, durationMinutes: customDuration } : current);
                  setActiveLayer(null);
                }}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SheetLayerModal>

      <SheetLayerModal
        visible={activeLayer === 'frequency'}
        title="Frequency"
        onClose={() => setActiveLayer(null)}
      >
        <View style={styles.overlayBody}>
          <View style={styles.overlayCard}>
            <View style={styles.toggleRowLeft}>
              <Toggle
                value={pendingRepeatConfig.enabled}
                onToggle={() =>
                  setPendingRepeatConfig((current) => ({
                    ...current,
                    enabled: !current.enabled,
                  }))
                }
              />
              <Text style={styles.overlayCardTitle}>Has Frequency</Text>
            </View>
            <View style={styles.rowDivider} />
            <Text style={styles.overlayLabel}>Occurring every</Text>
            <View style={styles.frequencyControls}>
              <Pressable
                style={styles.stepperField}
                onPress={() =>
                  setPendingRepeatConfig((current) => ({
                    ...current,
                    interval: Math.max(1, current.interval - 1),
                  }))
                }
              >
                <Text style={styles.stepperFieldText}>-</Text>
              </Pressable>
              <View style={styles.intervalValue}>
                <Text style={styles.intervalValueText}>{pendingRepeatConfig.interval}</Text>
              </View>
              <Pressable
                style={styles.stepperField}
                onPress={() =>
                  setPendingRepeatConfig((current) => ({
                    ...current,
                    interval: current.interval + 1,
                  }))
                }
              >
              <Text style={styles.stepperFieldText}>+</Text>
              </Pressable>
            </View>
            <View style={styles.choiceRow}>
              {(['hour', 'day', 'week', 'month'] as RepeatUnit[]).map((unit) => {
                const isSelected = pendingRepeatConfig.unit === unit;
                const label = getRepeatUnitLabel(unit, pendingRepeatConfig.interval);
                return (
                  <Pressable
                    key={unit}
                    style={[styles.unitChip, isSelected && styles.unitChipSelected]}
                    onPress={() =>
                      setPendingRepeatConfig((current) => ({
                        ...current,
                        unit,
                        daysOfWeek:
                          unit === 'week'
                            ? current.daysOfWeek?.length
                              ? current.daysOfWeek
                              : [getTodayRepeatDay()]
                            : current.daysOfWeek,
                        dayOfMonth:
                          unit === 'month'
                            ? current.dayOfMonth ?? getTodayDayOfMonth()
                            : current.dayOfMonth,
                      }))
                    }
                  >
                    <Text style={[styles.unitChipText, isSelected && styles.unitChipTextSelected]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {pendingRepeatConfig.unit === 'week' && (
              <View style={styles.frequencySubsection}>
                <Text style={styles.overlayLabel}>Day(s)</Text>
                <View style={styles.weekdayRow}>
                  {WEEKDAY_OPTIONS.map((option) => {
                    const isSelected = pendingRepeatConfig.daysOfWeek?.includes(option.key) ?? false;
                    return (
                      <Pressable
                        key={option.key}
                        style={[styles.weekdayChip, isSelected && styles.weekdayChipSelected]}
                        onPress={() =>
                          setPendingRepeatConfig((current) => {
                            const currentDays = current.daysOfWeek ?? ['mo'];
                            const exists = currentDays.includes(option.key);
                            const nextDays = exists
                              ? currentDays.filter((day) => day !== option.key)
                              : [...currentDays, option.key];

                            return {
                              ...current,
                              daysOfWeek: nextDays.length > 0 ? nextDays : currentDays,
                            };
                          })
                        }
                      >
                        <Text style={[styles.weekdayChipText, isSelected && styles.weekdayChipTextSelected]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
            {pendingRepeatConfig.unit === 'month' && (
              <View style={styles.frequencySubsection}>
                <Text style={styles.overlayLabel}>Day of month</Text>
                <View style={styles.monthDayCard}>
                  <View style={styles.monthDayGrid}>
                    {Array.from({ length: 29 }, (_, index) => index + 1).map((day) => {
                      const isSelected = pendingRepeatConfig.dayOfMonth === day;
                      return (
                        <Pressable
                          key={day}
                          style={[styles.monthDayCell, isSelected && styles.monthDayCellSelected]}
                          onPress={() =>
                            setPendingRepeatConfig((current) => ({
                              ...current,
                              dayOfMonth: day,
                            }))
                          }
                        >
                          <Text style={[styles.monthDayChipText, isSelected && styles.monthDayChipTextSelected]}>
                            {day}
                          </Text>
                        </Pressable>
                      );
                    })}
                    <Pressable
                      style={[
                        styles.monthDayLastCell,
                        pendingRepeatConfig.dayOfMonth === 31 && styles.monthDayLastCellSelected,
                      ]}
                      onPress={() =>
                        setPendingRepeatConfig((current) => ({
                          ...current,
                          dayOfMonth: 31,
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.monthDayLastLabel,
                          pendingRepeatConfig.dayOfMonth === 31 && styles.monthDayChipTextSelected,
                        ]}
                      >
                        Last day
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          </View>
          <View style={styles.overlayFooter}>
            <Pressable style={styles.cancelButton} onPress={() => setActiveLayer(null)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.saveButton}
              onPress={() => {
                setDraft((current) => current ? { ...current, repeatConfig: pendingRepeatConfig } : current);
                setActiveLayer(null);
              }}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </SheetLayerModal>

      <SheetLayerModal
        visible={activeLayer === 'reminder'}
        title="Reminders"
        onClose={() => setActiveLayer(null)}
      >
        <View style={styles.overlayBody}>
          <View style={styles.overlayCard}>
            <View style={styles.toggleRowLeft}>
              <Toggle
                value={pendingNotificationConfig.enabled}
                onToggle={() =>
                  setPendingNotificationConfig((current) => ({
                    ...current,
                    enabled: !current.enabled,
                  }))
                }
              />
              <Text style={styles.overlayCardTitle}>Has Reminder(s)</Text>
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.choiceRowWrap}>
              {REMINDER_OPTIONS.map((offset) => {
                const isSelected = pendingNotificationConfig.offsetMinutes === offset;
                return (
                  <Pressable
                    key={offset}
                    style={[styles.reminderChip, isSelected && styles.reminderChipSelected]}
                    onPress={() => setPendingNotificationConfig((current) => ({ ...current, offsetMinutes: offset }))}
                  >
                    <Text style={[styles.reminderChipText, isSelected && styles.reminderChipTextSelected]}>
                      {formatReminder(offset)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={styles.overlayFooter}>
            <Pressable style={styles.cancelButton} onPress={() => setActiveLayer(null)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.saveButton}
              onPress={() => {
                setDraft((current) => current ? { ...current, notificationConfig: pendingNotificationConfig } : current);
                setActiveLayer(null);
              }}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </SheetLayerModal>
    </>
  );
}

function TimeFieldGroup({
  label,
  fields,
  onChange,
}: {
  label: string;
  fields: { hour: string; minute: string; period: string };
  onChange: (value: { hour: string; minute: string; period: string }) => void;
}) {
  return (
    <View style={styles.timeGroup}>
      <Text style={styles.overlayLabel}>{label}</Text>
      <View style={styles.timeFieldRow}>
        <TextInput
          style={styles.timeField}
          keyboardType="number-pad"
          value={fields.hour}
          onChangeText={(hour) => onChange({ ...fields, hour })}
          placeholder="07"
        />
        <Text style={styles.timeColon}>:</Text>
        <TextInput
          style={styles.timeField}
          keyboardType="number-pad"
          value={fields.minute}
          onChangeText={(minute) => onChange({ ...fields, minute })}
          placeholder="00"
        />
        <View style={styles.periodColumn}>
          {['AM', 'PM'].map((period) => (
            <Pressable
              key={period}
              style={[styles.periodButton, fields.period === period && styles.periodButtonActive]}
              onPress={() => onChange({ ...fields, period })}
            >
              <Text style={[styles.periodButtonText, fields.period === period && styles.periodButtonTextActive]}>
                {period}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  sheet: {
    backgroundColor: colors.surface.sheet,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: 20,
    ...shadows.nav,
  },
  handle: {
    width: 24,
    height: 3,
    borderRadius: 99,
    backgroundColor: colors.content,
    opacity: 0.18,
    alignSelf: 'center',
  },
  sheetContent: {
    paddingHorizontal: 32,
    paddingTop: 18,
    paddingBottom: 36,
    gap: 14,
  },
  titleCard: {
    backgroundColor: colors.surface.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderDk,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.nav,
  },
  titleInput: {
    ...typography.headlineMedium,
    color: colors.content,
    minHeight: 32,
  },
  segmentedCard: {
    backgroundColor: 'transparent',
  },
  propertyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderDk,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  topPropertySurface: {
    backgroundColor: colors.surface.card,
  },
  topPropertyRow: {
    flexDirection: 'row',
  },
  topPropertyHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  propertyIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 99,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topPropertyHalfBorder: {
    borderLeftWidth: 1,
    borderLeftColor: colors.borderDk,
  },
  propertyLabelStrong: {
    ...typography.bodySmall,
    color: colors.content,
  },
  propertyValueInline: {
    ...typography.titleMedium,
    color: colors.content,
  },
  propertyLink: {
    ...typography.titleMedium,
    color: colors.content,
    textDecorationLine: 'underline',
  },
  settingsSurface: {
    backgroundColor: colors.border,
  },
  sectionLabel: {
    ...typography.titleSmall,
    color: colors.content,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  durationChip: {
    minWidth: 72,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderDk,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
  },
  customDurationValue: {
    ...typography.headlineMedium,
    color: colors.content,
    textAlign: 'center',
    fontSize: 28,
  },
  durationBoundsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationBoundText: {
    ...typography.titleSmall,
    color: colors.content,
    opacity: 0.7,
  },
  durationSliderArea: {
    height: 42,
    justifyContent: 'center',
  },
  durationSliderTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.borderDk,
  },
  durationSliderFill: {
    position: 'absolute',
    left: 0,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.content,
  },
  durationSliderThumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.content,
    borderWidth: 4,
    borderColor: colors.surface.card,
    ...shadows.nav,
  },
  durationStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  durationChipSelected: {
    backgroundColor: colors.content,
    borderColor: colors.content,
  },
  durationChipText: {
    ...typography.bodySmall,
    color: colors.content,
    textAlign: 'center',
  },
  durationChipTextSelected: {
    color: colors.surface.card,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.borderDk,
  },
  toggleRow: {
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleRowText: {
    ...typography.titleMedium,
    color: colors.content,
  },
  toggleMeta: {
    ...typography.titleSmall,
    color: colors.content,
    opacity: 0.7,
    maxWidth: 120,
    textAlign: 'right',
  },
  toggleMetaButton: {
    minHeight: 42,
    justifyContent: 'center',
  },
  toggle: {
    width: 42,
    height: 24,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: colors.content,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.content,
  },
  toggleKnob: {
    width: 14,
    height: 14,
    borderRadius: 14,
    backgroundColor: colors.content,
  },
  toggleKnobActive: {
    backgroundColor: colors.surface.card,
    alignSelf: 'flex-end',
  },
  eventHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  eventDateButton: {
    flex: 1,
    marginRight: spacing.md,
  },
  eventDateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventToggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventToggleText: {
    ...typography.titleSmall,
    color: colors.content,
  },
  eventTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 8,
    backgroundColor: colors.surface.card,
  },
  eventTimeButton: {
    minWidth: 82,
    borderRadius: 8,
    backgroundColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  eventTimeButtonText: {
    ...typography.titleMedium,
    color: colors.content,
  },
  eventTimeBetween: {
    ...typography.titleMedium,
    color: colors.content,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
  },
  cancelButton: {
    width: 101,
    borderRadius: 99,
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.borderDk,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  cancelButtonText: {
    ...typography.bodySmall,
    color: colors.content,
  },
  saveButton: {
    flex: 1,
    borderRadius: 99,
    backgroundColor: colors.content,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  saveButtonDisabled: {
    backgroundColor: colors.borderDk,
    borderColor: colors.borderDk,
  },
  saveButtonText: {
    ...typography.bodySmall,
    color: colors.surface.card,
  },
  saveButtonTextDisabled: {
    color: colors.surface.card,
    opacity: 0.85,
  },
  overlaySheet: {
    backgroundColor: colors.surface.sheet,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingBottom: 34,
    minHeight: 320,
    ...shadows.nav,
  },
  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  overlayAction: {
    ...typography.bodySmall,
    color: colors.content,
  },
  overlayTitle: {
    ...typography.headlineMedium,
    color: colors.content,
  },
  overlaySpacer: {
    width: 52,
  },
  overlayBody: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  overlayFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  calendarQuickChip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderDk,
    backgroundColor: colors.surface.card,
    paddingVertical: 12,
    alignItems: 'center',
  },
  calendarQuickChipSelected: {
    backgroundColor: colors.content,
    borderColor: colors.content,
  },
  calendarQuickChipText: {
    ...typography.titleSmall,
    color: colors.content,
  },
  calendarQuickChipTextSelected: {
    color: colors.surface.card,
  },
  calendarCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderDk,
    backgroundColor: colors.surface.bg,
    overflow: 'hidden',
  },
  calendarHeader: {
    minHeight: 42,
    backgroundColor: colors.border,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarMonthLabel: {
    ...typography.headlineMedium,
    color: colors.content,
  },
  calendarNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarNavButton: {
    width: 32,
    height: 32,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarNavIconFlipped: {
    transform: [{ rotate: '180deg' }],
  },
  calendarWeekRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  calendarWeekday: {
    flex: 1,
    textAlign: 'center',
    ...typography.titleSmall,
    color: colors.content,
    opacity: 0.7,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  calendarCell: {
    width: '14.285%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  calendarDayCircle: {
    width: 40,
    height: 40,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayCircleSelected: {
    backgroundColor: colors.content,
  },
  calendarDayLabel: {
    ...typography.titleMedium,
    color: colors.content,
  },
  calendarDayLabelSelected: {
    color: colors.surface.card,
    fontFamily: typography.bodySmall.fontFamily,
  },
  overlaySubtitle: {
    ...typography.titleMedium,
    color: colors.content,
    textAlign: 'center',
  },
  taskTimeSelectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderDk,
    backgroundColor: colors.surface.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 4,
  },
  taskTimeSelectionLabel: {
    ...typography.titleSmall,
    color: colors.content,
    opacity: 0.7,
  },
  taskTimeSelectionValue: {
    ...typography.titleMedium,
    color: colors.content,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDk,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surface.sheet,
  },
  quickChipText: {
    ...typography.bodySmall,
    color: colors.content,
  },
  dateStepperRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepperButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  stepperButtonText: {
    ...typography.bodySmall,
    color: colors.content,
  },
  dateFieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  smallField: {
    flex: 1,
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDk,
    backgroundColor: colors.surface.sheet,
    paddingHorizontal: 14,
    ...typography.titleMedium,
    color: colors.content,
  },
  yearField: {
    flex: 1.4,
  },
  fullSaveButton: {
    borderRadius: 99,
    backgroundColor: colors.content,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  fullSaveButtonText: {
    ...typography.bodySmall,
    color: colors.surface.card,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choiceChip: {
    width: '31%',
    minWidth: 96,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderDk,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surface.card,
  },
  choiceChipSelected: {
    backgroundColor: colors.content,
    borderColor: colors.content,
  },
  choiceChipText: {
    ...typography.bodySmall,
    color: colors.content,
  },
  choiceChipTextSelected: {
    color: colors.surface.card,
  },
  timeGroup: {
    gap: 8,
  },
  materialTimeHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  materialTimeTab: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderDk,
    backgroundColor: colors.surface.card,
    padding: spacing.md,
    gap: 4,
  },
  materialTimeTabActive: {
    borderColor: colors.content,
    backgroundColor: colors.border,
  },
  materialTimeTabLabel: {
    ...typography.titleSmall,
    color: colors.content,
    opacity: 0.7,
  },
  materialTimeTabLabelActive: {
    opacity: 1,
  },
  materialTimeTabValue: {
    ...typography.titleMedium,
    color: colors.content,
  },
  materialTimeTabValueActive: {
    fontFamily: typography.bodySmall.fontFamily,
  },
  materialPickerCard: {
    borderRadius: 18,
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.borderDk,
    padding: spacing.lg,
    gap: spacing.md,
  },
  materialDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  materialDisplayBlock: {
    width: 96,
    minHeight: 76,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialDisplayText: {
    fontFamily: typography.headlineMedium.fontFamily,
    fontSize: 34,
    color: colors.content,
    opacity: 0.72,
  },
  materialDisplayTextActive: {
    opacity: 1,
  },
  materialDisplayColon: {
    fontFamily: typography.headlineMedium.fontFamily,
    fontSize: 34,
    color: colors.content,
  },
  materialModeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  materialModeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderDk,
    backgroundColor: colors.surface.sheet,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  materialModeChipActive: {
    backgroundColor: colors.content,
    borderColor: colors.content,
  },
  materialModeChipText: {
    ...typography.titleSmall,
    color: colors.content,
  },
  materialModeChipTextActive: {
    color: colors.surface.card,
  },
  clockFace: {
    width: 236,
    height: 236,
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: colors.border,
    position: 'relative',
  },
  clockNumber: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockNumberSelected: {
    backgroundColor: colors.content,
  },
  clockNumberText: {
    ...typography.titleMedium,
    color: colors.content,
  },
  clockNumberTextSelected: {
    color: colors.surface.card,
    fontFamily: typography.bodySmall.fontFamily,
  },
  clockCenterDot: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.content,
    transform: [{ translateX: -5 }, { translateY: -5 }],
  },
  overlayLabel: {
    ...typography.titleSmall,
    color: colors.content,
  },
  timeFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeField: {
    flex: 1,
    minHeight: 78,
    borderRadius: 12,
    backgroundColor: colors.border,
    textAlign: 'center',
    fontFamily: typography.headlineMedium.fontFamily,
    fontSize: 34,
    color: colors.content,
  },
  timeColon: {
    ...typography.headlineMedium,
    color: colors.content,
    fontSize: 34,
  },
  periodColumn: {
    width: 68,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderDk,
    backgroundColor: colors.border,
  },
  periodButton: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
  },
  periodButtonActive: {
    backgroundColor: colors.content,
  },
  periodButtonText: {
    ...typography.bodySmall,
    color: colors.content,
  },
  periodButtonTextActive: {
    color: colors.surface.card,
  },
  overlayCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface.card,
    padding: spacing.lg,
    gap: 14,
    ...shadows.nav,
  },
  overlayCardTitle: {
    ...typography.titleMedium,
    color: colors.content,
  },
  frequencyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  frequencySubsection: {
    gap: 8,
  },
  stepperField: {
    width: 54,
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperFieldText: {
    ...typography.headlineMedium,
    color: colors.content,
  },
  intervalValue: {
    flex: 1,
    minHeight: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intervalValueText: {
    ...typography.headlineMedium,
    color: colors.content,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  weekdayChip: {
    width: 38,
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderDk,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayChipSelected: {
    backgroundColor: colors.content,
    borderColor: colors.content,
  },
  weekdayChipText: {
    ...typography.bodySmall,
    color: colors.content,
  },
  weekdayChipTextSelected: {
    color: colors.surface.card,
  },
  monthDayCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderDk,
    backgroundColor: colors.surface.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  monthDayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
  },
  monthDayCell: {
    width: '14.285%',
    minHeight: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDayCellSelected: {
    backgroundColor: colors.content,
  },
  monthDayLastCell: {
    minHeight: 38,
    marginTop: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDayLastCellSelected: {
    backgroundColor: colors.content,
  },
  monthDayChipText: {
    ...typography.titleSmall,
    color: colors.content,
  },
  monthDayChipTextSelected: {
    color: colors.surface.card,
  },
  monthDayLastLabel: {
    ...typography.titleMedium,
    color: colors.content,
  },
  unitChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDk,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surface.sheet,
  },
  unitChipSelected: {
    backgroundColor: colors.content,
    borderColor: colors.content,
  },
  unitChipText: {
    ...typography.bodySmall,
    color: colors.content,
  },
  unitChipTextSelected: {
    color: colors.surface.card,
  },
  choiceRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reminderChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDk,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surface.sheet,
  },
  reminderChipSelected: {
    backgroundColor: colors.content,
    borderColor: colors.content,
  },
  reminderChipText: {
    ...typography.titleSmall,
    color: colors.content,
  },
  reminderChipTextSelected: {
    color: colors.surface.card,
  },
});
