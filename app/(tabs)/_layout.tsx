import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { colors, shadows, typography, spacing } from '@/constants/theme';
import { ListCheckIcon, PenToSquareIcon } from '@/components/icons';

function TabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBarOuter}>
      <View style={styles.segmentBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isSchedule = route.name === 'index';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <View
              key={route.key}
              style={[
                styles.segmentItem,
                isFocused && styles.segmentItemActive,
              ]}
              onTouchEnd={onPress}
            >
              {isSchedule ? (
                <ListCheckIcon size={16} color={colors.content} />
              ) : (
                <PenToSquareIcon size={16} color={colors.content} />
              )}
              <Text style={styles.segmentLabel}>
                {isSchedule ? 'Schedule' : 'Planning'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Schedule' }} />
      <Tabs.Screen name="planning" options={{ title: 'Planning' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    backgroundColor: colors.surface.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
    paddingBottom: 16,
  },
  segmentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.border,
    borderRadius: 57,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 4,
  },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 108,
  },
  segmentItemActive: {
    backgroundColor: colors.surface.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...shadows.nav,
  },
  segmentLabel: {
    ...typography.bodySmall,
    color: colors.content,
  },
});
