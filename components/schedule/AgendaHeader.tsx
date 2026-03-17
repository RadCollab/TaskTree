import { AutoScheduleIcon, SortIcon } from '@/components/icons';
import { colors, spacing, typography } from '@/constants/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function AgendaHeader() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agenda</Text>
      <View style={styles.actions}>
        <Pressable style={styles.iconButton}>
          <AutoScheduleIcon size={16} color={colors.content} />
        </Pressable>
        <Pressable style={styles.iconButton}>
          <SortIcon size={16} color={colors.content} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.bodySmall,
    color: colors.content,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 108,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
