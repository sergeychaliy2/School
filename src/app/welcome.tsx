import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { GradePicker } from '@/components/GradePicker';
import { Press, Screen, Txt } from '@/components/ui';
import { SCHOOL } from '@/data/school';
import { lessonsCount } from '@/domain/format';
import { gradeLabel, weeklyLessonCount } from '@/domain/schedule';
import { useApp } from '@/store/app';
import { radius, spacing, useTheme } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const { signIn, setBrowseGrade, activeGrade, profile } = useApp();

  const [grade, setGrade] = useState<string | null>(activeGrade);
  const [name, setName] = useState(profile?.name ?? '');
  const [focused, setFocused] = useState(false);

  const trimmed = name.trim();

  const proceed = () => {
    if (!grade) return;
    if (trimmed) signIn({ name: trimmed, grade });
    else setBrowseGrade(grade);
    router.replace('/');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(380)}>
            <Txt variant="label" tone="accent">
              {SCHOOL.shortName}
            </Txt>
            <Txt variant="display" style={{ marginTop: spacing.sm }}>
              Расписание{'\n'}всегда с собой
            </Txt>
            <Txt variant="body" tone="dim" style={{ marginTop: spacing.md }}>
              Выбери свой класс — и приложение будет показывать, какой урок идёт сейчас и что
              дальше. Имя нужно только для приветствия и хранится на твоём телефоне.
            </Txt>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(380)}>
            <Txt variant="heading" style={{ marginBottom: spacing.sm }}>
              Твой класс
            </Txt>
            <GradePicker value={grade} onChange={setGrade} size="lg" />
            {grade ? (
              <Animated.View entering={FadeIn.duration(240)}>
                <Txt variant="label" tone="faint" style={{ marginTop: spacing.sm }}>
                  {gradeLabel(grade)} · {lessonsCount(weeklyLessonCount(grade))} в неделю
                </Txt>
              </Animated.View>
            ) : null}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(380)}>
            <Txt variant="heading" style={{ marginBottom: spacing.sm }}>
              Как тебя зовут
              <Txt variant="label" tone="faint">
                {'  '}необязательно
              </Txt>
            </Txt>
            <TextInput
              value={name}
              onChangeText={setName}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Имя и фамилия"
              placeholderTextColor={palette.textFaint}
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={proceed}
              style={[
                styles.input,
                {
                  backgroundColor: palette.surface,
                  borderColor: focused ? palette.accent : palette.border,
                  color: palette.text,
                },
              ]}
            />
          </Animated.View>

          <View style={{ flex: 1 }} />

          <Animated.View entering={FadeInDown.delay(280).duration(380)} style={styles.actions}>
            <Press
              onPress={proceed}
              disabled={!grade}
              haptic="medium"
              style={[styles.primary, { backgroundColor: palette.accent }]}>
              <Txt variant="heading" color="#FFFFFF">
                {trimmed ? 'Продолжить' : 'Смотреть расписание'}
              </Txt>
            </Press>

            <Txt variant="caption" tone="faint" style={styles.legal}>
              Приложение работает без интернета и ничего никуда не отправляет.
            </Txt>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    gap: spacing.xl,
  },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    fontWeight: '600',
  },
  actions: { gap: spacing.md, paddingTop: spacing.lg },
  primary: {
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legal: { textAlign: 'center' },
});
