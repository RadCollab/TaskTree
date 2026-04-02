import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TaskTypeIcon } from '@/components/icons/TaskTypeIcon';
import { colors, typography } from '@/constants/theme';

interface ScheduleEmptyStateProps {
  onAddTask: () => void;
  onAddEvent: () => void;
}

function withAlpha(hex: string, alpha: string) {
  return `${hex}${alpha}`;
}

export function ScheduleEmptyState({ onAddTask, onAddEvent }: ScheduleEmptyStateProps) {
  return (
    <View style={styles.container}>
      <Pressable style={[styles.button, { backgroundColor: withAlpha(colors.types.forest, '14') }]} onPress={onAddTask}>
        <TaskTypeIcon shape="circle" variant="small" color={colors.types.forest} size={16} />
        <Text style={[styles.buttonLabel, { color: colors.types.forest }]}>Add Task</Text>
      </Pressable>

      <Pressable style={[styles.button, { backgroundColor: withAlpha(colors.types.indigo, '14') }]} onPress={onAddEvent}>
        <TaskTypeIcon shape="square" variant="small" color={colors.types.indigo} size={16} />
        <Text style={[styles.buttonLabel, { color: colors.types.indigo }]}>Add Event</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  button: {
    minHeight: 52,
    borderRadius: 34,
    paddingHorizontal: 29,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  buttonLabel: {
    ...typography.titleSmall,
    lineHeight: 13,
  },
});
