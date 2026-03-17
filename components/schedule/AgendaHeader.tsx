import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, typography, spacing } from '@/constants/theme';

export function AgendaHeader() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agenda</Text>
      <View style={styles.actions}>
        <Pressable style={styles.iconButton}>
          <Text style={styles.icon}>📅</Text>
        </Pressable>
        <Pressable style={styles.iconButton}>
          <Text style={styles.icon}>↕️</Text>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.titleSmall,
    color: colors.content,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    color: colors.content,
  },
});
