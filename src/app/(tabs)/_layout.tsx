import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Press, Txt } from '@/components/ui';
import { useApp } from '@/store/app';
import { radius, spacing, useTheme } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/** expo-router bundles its own tab navigator, so take the prop type from it. */
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONS: Record<string, { on: IconName; off: IconName; label: string }> = {
  index: { on: 'today', off: 'today-outline', label: 'Сегодня' },
  week: { on: 'grid', off: 'grid-outline', label: 'Неделя' },
  homework: { on: 'create', off: 'create-outline', label: 'Домашка' },
  school: { on: 'school', off: 'school-outline', label: 'Школа' },
};

function TabItem({
  focused,
  onPress,
  name,
}: {
  focused: boolean;
  onPress: () => void;
  name: string;
}) {
  const { palette } = useTheme();
  const config = ICONS[name];

  const pill = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0, { duration: 180 }),
    transform: [{ scale: withSpring(focused ? 1 : 0.8, { damping: 16, stiffness: 240 }) }],
  }));

  const content = useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(focused ? -1 : 0, { damping: 18, stiffness: 260 }) }],
  }));

  if (!config) return null;

  return (
    <Press
      onPress={onPress}
      haptic="light"
      accessibilityRole="tab"
      accessibilityLabel={config.label}
      style={styles.item}>
      <Animated.View
        style={[styles.pill, { backgroundColor: palette.accentSoft }, pill]}
        pointerEvents="none"
      />
      <Animated.View style={[styles.itemInner, content]}>
        <Ionicons
          name={focused ? config.on : config.off}
          size={21}
          color={focused ? palette.accent : palette.textFaint}
        />
        <Txt variant="caption" color={focused ? palette.accent : palette.textFaint}>
          {config.label}
        </Txt>
      </Animated.View>
    </Press>
  );
}

function TabBar({ state, navigation }: TabBarProps) {
  const { palette, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: palette.bgElevated,
          borderColor: palette.border,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
        },
        !isDark && styles.barShadow,
      ]}>
      {state.routes.map((route, index) => {
        if (!ICONS[route.name]) return null;
        const focused = state.index === index;

        return (
          <TabItem
            key={route.key}
            name={route.name}
            focused={focused}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
          />
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { activeGrade } = useApp();

  // Nothing to show until a class is chosen — send them to onboarding.
  if (!activeGrade) return <Redirect href="/welcome" />;

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="week" />
      <Tabs.Screen name="homework" />
      <Tabs.Screen name="school" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  barShadow: {
    shadowColor: '#1B2440',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  itemInner: { alignItems: 'center', gap: 3 },
  pill: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
    right: spacing.md,
    bottom: 0,
    borderRadius: radius.md,
  },
});
