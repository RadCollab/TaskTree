import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, shadows } from '@/constants/theme';

interface MultiSelectBarProps {
  selectedCount: number;
  onClear: () => void;
  onAddToSchedule: () => void;
}

export function MultiSelectBar({ selectedCount, onClear, onAddToSchedule }: MultiSelectBarProps) {
  if (selectedCount === 0) return null;

  return (
    <View style={styles.container}>
      <Pressable style={styles.clearButton} onPress={onClear}>
        <Text style={styles.clearText}>Clear</Text>
      </Pressable>
      <Pressable style={styles.addButton} onPress={onAddToSchedule}>
        <Text style={styles.addText}>Add to Schedule</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.nav,
  },
  clearButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  clearText: {
    ...typography.bodySmall,
    color: colors.content,
  },
  addButton: {
    backgroundColor: colors.content,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 20,
  },
  addText: {
    ...typography.bodySmall,
    color: '#fff',
  },
});
