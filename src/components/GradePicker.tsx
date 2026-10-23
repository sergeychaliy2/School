import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Press, Txt } from '@/components/ui';
import { GRADES } from '@/domain/schedule';
import { radius, spacing, useTheme } from '@/theme';

function GradeChip({
  grade,
  selected,
  onPress,
  size,
}: {
  grade: string;
  selected: boolean;
  onPress: () => void;
  size: 'md' | 'lg';
}) {
  const { palette } = useTheme();

  const box = useAnimatedStyle(() => ({
    backgroundColor: withTiming(selected ? palette.accent : palette.surface, { duration: 180 }),
    borderColor: withTiming(selected ? palette.accent : palette.border, { duration: 180 }),
  }));

  const dimension = size === 'lg' ? 58 : 46;

  return (
    <Press onPress={onPress} accessibilityLabel={`${grade} класс`} haptic="light">
      <Animated.View
        style={[
          styles.chip,
          { width: dimension, height: dimension, borderRadius: radius.md },
          box,
        ]}>
        <Txt
          variant={size === 'lg' ? 'title' : 'heading'}
          color={selected ? '#FFFFFF' : palette.textDim}>
          {grade}
        </Txt>
      </Animated.View>
    </Press>
  );
}

/** Horizontal class selector, 1 through 10 — the grades the school actually runs. */
export function GradePicker({
  value,
  onChange,
  size = 'md',
}: {
  value: string | null;
  onChange: (grade: string) => void;
  size?: 'md' | 'lg';
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}>
      {GRADES.map((grade) => (
        <GradeChip
          key={grade}
          grade={grade}
          size={size}
          selected={grade === value}
          onPress={() => onChange(grade)}
        />
      ))}
      <View style={{ width: spacing.xs }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
