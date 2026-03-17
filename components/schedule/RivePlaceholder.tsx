import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@/constants/theme';

export function RivePlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>RIVE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    backgroundColor: colors.surface.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  text: {
    ...typography.headlineMedium,
    fontSize: 32,
    color: colors.content,
    letterSpacing: 8,
  },
});
