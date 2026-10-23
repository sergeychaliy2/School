import * as Haptics from 'expo-haptics';
import { type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { radius, spacing, useTheme } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/* ------------------------------------------------------------------ Screen */

export function Screen({
  children,
  edges = ['top'],
  style,
}: {
  children: ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}) {
  const { palette } = useTheme();
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: palette.bg }, style]}>
      {children}
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------- Text */

type TxtVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'mono';

const VARIANTS: Record<TxtVariant, TextStyle> = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.6 },
  title: { fontSize: 24, lineHeight: 29, fontWeight: '700', letterSpacing: -0.4 },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
  label: { fontSize: 13, lineHeight: 17, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.2 },
  mono: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.2,
  },
};

export function Txt({
  children,
  variant = 'body',
  tone = 'default',
  color,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  variant?: TxtVariant;
  tone?: 'default' | 'dim' | 'faint' | 'accent';
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const { palette } = useTheme();
  const toned =
    color ??
    (tone === 'dim'
      ? palette.textDim
      : tone === 'faint'
        ? palette.textFaint
        : tone === 'accent'
          ? palette.accent
          : palette.text);

  return (
    <Text numberOfLines={numberOfLines} style={[VARIANTS[variant], { color: toned }, style]}>
      {children}
    </Text>
  );
}

/* -------------------------------------------------------------------- Card */

export function Card({
  children,
  style,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const { palette, isDark } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: palette.card,
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: palette.border,
          padding: padded ? spacing.lg : 0,
        },
        !isDark && styles.lightShadow,
        style,
      ]}>
      {children}
    </View>
  );
}

/* ----------------------------------------------------------------- Press */

/** Pressable that dips slightly under the finger. Keeps taps feeling physical. */
export function Press({
  children,
  onPress,
  onLongPress,
  style,
  haptic = 'light',
  disabled,
  accessibilityLabel,
  accessibilityRole = 'button',
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  haptic?: 'light' | 'medium' | 'none';
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: PressableProps['accessibilityRole'];
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const buzz = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(style).catch(() => {
      /* haptics are a nicety; a device without a motor must not break the tap */
    });
  };

  const fire = () => {
    if (disabled) return;
    if (haptic !== 'none') {
      buzz(
        haptic === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light,
      );
    }
    onPress?.();
  };

  const fireLong = () => {
    if (disabled || !onLongPress) return;
    // A heavier buzz so a destructive long-press feels different from a tap.
    buzz(Haptics.ImpactFeedbackStyle.Heavy);
    onLongPress();
  };

  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 18, stiffness: 320 });
        opacity.value = withTiming(0.9, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 260 });
        opacity.value = withTiming(1, { duration: 140 });
      }}
      onPress={fire}
      onLongPress={onLongPress ? fireLong : undefined}
      delayLongPress={450}
      style={[animated, disabled && { opacity: 0.45 }, style]}>
      {children}
    </AnimatedPressable>
  );
}

/* -------------------------------------------------------------------- Pill */

export function Pill({
  label,
  tone = 'neutral',
  color,
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'live';
  color?: string;
}) {
  const { palette } = useTheme();
  const bg =
    color ??
    (tone === 'accent' ? palette.accentSoft : tone === 'live' ? 'rgba(72,209,136,0.16)' : palette.surface);
  const fg =
    tone === 'accent' ? palette.accent : tone === 'live' ? palette.success : palette.textDim;

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
      }}>
      <Txt variant="caption" color={fg}>
        {label}
      </Txt>
    </View>
  );
}

/* ----------------------------------------------------------------- Divider */

export function Divider({ inset = 0 }: { inset?: number }) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: palette.border,
        marginLeft: inset,
      }}
    />
  );
}

const styles = StyleSheet.create({
  lightShadow: {
    shadowColor: '#1B2440',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
});
