import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, typography } from '@/constants/theme';
import { ListCheckIcon, TrashIcon } from '@/components/icons';

interface MultiSelectBarProps {
  selectedCount: number;
  onClear: () => void;
  onAddToSchedule: () => void;
}

export function MultiSelectBar({ selectedCount, onClear, onAddToSchedule }: MultiSelectBarProps) {
  const isActive = selectedCount > 0;

  return (
    <View style={[styles.container, !isActive && styles.containerInactive]}>
      <View style={styles.row}>
        <Pressable
          style={styles.clearButton}
          onPress={onClear}
          disabled={!isActive}
        >
          <TrashIcon size={16} color={colors.content} />
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
        <Pressable
          style={styles.addButton}
          onPress={onAddToSchedule}
          disabled={!isActive}
        >
          <ListCheckIcon size={16} color={colors.surface.bg} />
          <Text style={styles.addText}>Add to Schedule</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: 16,
  },
  containerInactive: {
    opacity: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.border,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 108,
  },
  clearText: {
    ...typography.bodySmall,
    color: colors.content,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.content,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 108,
  },
  addText: {
    ...typography.bodySmall,
    color: colors.surface.bg,
  },
});
