import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { colors, shadows, typography } from '@/constants/theme';

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Text style={[styles.iconText, { color }]}>{name === 'schedule' ? '📅' : '✏️'}</Text>
      <Text style={[styles.iconLabel, { color }]}>{name === 'schedule' ? 'Schedule' : 'Planning'}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.content,
        tabBarInactiveTintColor: colors.borderDk,
        tabBarStyle: {
          backgroundColor: colors.surface.card,
          borderTopColor: colors.border,
          ...shadows.nav,
          height: 78,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'NunitoSans_700Bold',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="schedule" color={color} focused={focused} />
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="planning"
        options={{
          title: 'Planning',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="planning" color={color} focused={focused} />
          ),
          tabBarLabel: () => null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  iconContainerActive: {
    backgroundColor: colors.surface.bg,
  },
  iconText: {
    fontSize: 14,
  },
  iconLabel: {
    fontFamily: 'NunitoSans_700Bold',
    fontSize: 11,
  },
});
