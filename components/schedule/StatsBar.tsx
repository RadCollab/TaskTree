import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, typography, spacing } from '@/constants/theme';

interface StatItemProps {
  emoji: string;
  count: number;
  color?: string;
}

function StatItem({ emoji, count, color }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.count, color ? { color } : undefined]}>{count}</Text>
    </View>
  );
}

export function StatsBar() {
  return (
    <View style={styles.container}>
      <View style={styles.stats}>
        <StatItem emoji="🕊️" count={17} />
        <StatItem emoji="🪶" count={7} color={colors.types.rose} />
        <StatItem emoji="❤️" count={0} color={colors.types.rose} />
        <StatItem emoji="🌲" count={4} />
      </View>
      <Pressable style={styles.gearButton}>
        <Text style={styles.gearIcon}>⚙️</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  emoji: {
    fontSize: 14,
  },
  count: {
    ...typography.bodyLarge,
    color: colors.content,
  },
  gearButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gearIcon: {
    fontSize: 16,
  },
});
