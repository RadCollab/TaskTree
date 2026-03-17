import { View, Image, StyleSheet, Pressable } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { SettingsIcon } from '@/components/icons';

export function RivePlaceholder() {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/placeholder.png')}
        style={styles.image}
        resizeMode="cover"
      />
      <Pressable style={styles.settingsButton}>
        <SettingsIcon size={16} color={colors.content} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 341,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  settingsButton: {
    position: 'absolute',
    top: 56,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 108,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
