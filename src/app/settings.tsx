import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GradePicker } from '@/components/GradePicker';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card, Divider, Press, Screen, Txt } from '@/components/ui';
import { addDays, dateKey, monthLabel, monthRange } from '@/domain/homework';
import { scheduleDoc } from '@/domain/schedule';
import { dropPhotos } from '@/lib/photos';
import { useApp, type ThemePref } from '@/store/app';
import { radius, spacing, useTheme } from '@/theme';

const THEME_OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'Как в системе' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const {
    profile,
    activeGrade,
    signIn,
    signOut,
    setGrade,
    themePref,
    setThemePref,
    bellsTouched,
    homework,
    clearHomework,
  } = useApp();

  const mine = homework.filter((task) => task.grade === activeGrade);
  const today = dateKey(new Date());

  /** Bulk clears must take the attached photo files with them, not orphan them. */
  const confirmClear = (
    title: string,
    message: string,
    doomed: typeof mine,
    run: () => void,
  ) => {
    Alert.alert(title, message, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Стереть',
        style: 'destructive',
        onPress: () => {
          doomed.forEach((task) => dropPhotos(task.photos));
          run();
        },
      },
    ]);
  };

  const countInRange = (from: string, to: string) =>
    mine.filter((task) => task.date >= from && task.date <= to).length;

  const [name, setName] = useState(profile?.name ?? '');

  const commitName = () => {
    const trimmed = name.trim();
    if (!activeGrade) return;
    if (trimmed) signIn({ name: trimmed, grade: activeGrade });
    else signOut();
  };

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Настройки" />

        <Animated.View entering={FadeInDown.duration(280)}>
          <Txt variant="label" tone="dim" style={styles.caption}>
            Профиль
          </Txt>
          <Card>
            <Txt variant="label" tone="faint">
              Имя
            </Txt>
            <TextInput
              value={name}
              onChangeText={setName}
              onBlur={commitName}
              placeholder="Без имени"
              placeholderTextColor={palette.textFaint}
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={commitName}
              style={[
                styles.input,
                { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text },
              ]}
            />

            <Txt variant="label" tone="faint" style={{ marginTop: spacing.lg }}>
              Класс
            </Txt>
            <GradePicker value={activeGrade} onChange={setGrade} />

            <Txt variant="caption" tone="faint" style={{ marginTop: spacing.sm }}>
              Имя и класс хранятся только на этом телефоне и никуда не отправляются.
            </Txt>

            {profile ? (
              <Press
                onPress={() => {
                  signOut();
                  setName('');
                }}
                style={[styles.ghost, { borderColor: palette.border }]}>
                <Txt variant="heading" color={palette.danger}>
                  Выйти из профиля
                </Txt>
              </Press>
            ) : null}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(280)}>
          <Txt variant="label" tone="dim" style={styles.caption}>
            Оформление
          </Txt>
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {THEME_OPTIONS.map((option, index) => (
              <View key={option.value}>
                {index > 0 ? <Divider inset={spacing.lg} /> : null}
                <Press onPress={() => setThemePref(option.value)} style={styles.optionRow}>
                  <Txt variant="heading">{option.label}</Txt>
                  {themePref === option.value ? (
                    <Ionicons name="checkmark-circle" size={22} color={palette.accent} />
                  ) : (
                    <Ionicons name="ellipse-outline" size={22} color={palette.textFaint} />
                  )}
                </Press>
              </View>
            ))}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(280)}>
          <Txt variant="label" tone="dim" style={styles.caption}>
            Расписание звонков
          </Txt>
          <Card padded={false} style={{ overflow: 'hidden' }}>
            <Press onPress={() => router.push('/bells')} style={styles.optionRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt variant="heading">Время уроков</Txt>
                <Txt variant="label" tone="faint" style={{ marginTop: 2 }}>
                  {bellsTouched ? 'Изменено вручную' : 'Как на объявлении в школе'}
                </Txt>
              </View>
              <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
            </Press>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(280)}>
          <Txt variant="label" tone="dim" style={styles.caption}>
            Домашка
          </Txt>
          <Card padded={false} style={{ overflow: 'hidden' }}>
            <Press
              onPress={() => {
                const to = addDays(today, -1);
                const count = countInRange('0000-00-00', to);
                if (count === 0) {
                  Alert.alert('Нечего стирать', 'Старых заданий нет.');
                  return;
                }
                confirmClear(
                  'Стереть прошедшее?',
                  `Заданий до сегодняшнего дня: ${count}. Сегодняшние и будущие останутся.`,
                  mine.filter((task) => task.date <= to),
                  () => clearHomework({ from: '0000-00-00', to }),
                );
              }}
              style={styles.optionRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt variant="heading">Стереть прошедшее</Txt>
                <Txt variant="label" tone="faint" style={{ marginTop: 2 }}>
                  Всё, что было до сегодня
                </Txt>
              </View>
              <Ionicons name="time-outline" size={20} color={palette.textFaint} />
            </Press>

            <Divider inset={spacing.lg} />

            <Press
              onPress={() => {
                const { from, to } = monthRange(today);
                const count = countInRange(from, to);
                if (count === 0) {
                  Alert.alert('Нечего стирать', `За ${monthLabel(today).toLowerCase()} заданий нет.`);
                  return;
                }
                confirmClear(
                  'Стереть за месяц?',
                  `${monthLabel(today)} — заданий: ${count}.`,
                  mine.filter((task) => task.date >= from && task.date <= to),
                  () => clearHomework({ from, to }),
                );
              }}
              style={styles.optionRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt variant="heading">Стереть за этот месяц</Txt>
                <Txt variant="label" tone="faint" style={{ marginTop: 2 }}>
                  {monthLabel(today)}
                </Txt>
              </View>
              <Ionicons name="calendar-outline" size={20} color={palette.textFaint} />
            </Press>

            <Divider inset={spacing.lg} />

            <Press
              onPress={() => {
                if (mine.length === 0) {
                  Alert.alert('Нечего стирать', 'Заданий пока нет.');
                  return;
                }
                confirmClear(
                  'Стереть всю домашку?',
                  `Будет удалено заданий: ${mine.length}. Вместе с прикреплёнными фото. Отменить нельзя.`,
                  mine,
                  () => clearHomework({}),
                );
              }}
              style={styles.optionRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt variant="heading" color={palette.danger}>
                  Стереть всю домашку
                </Txt>
                <Txt variant="label" tone="faint" style={{ marginTop: 2 }}>
                  Сейчас записано: {mine.length}
                </Txt>
              </View>
              <Ionicons name="trash-outline" size={20} color={palette.danger} />
            </Press>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(280)}>
          <Txt variant="label" tone="dim" style={styles.caption}>
            О приложении
          </Txt>
          <Card>
            <Txt variant="body" tone="dim">
              Расписание утверждено {scheduleDoc.approvedOn.split('-').reverse().join('.')} —{' '}
              {scheduleDoc.approvedBy}.
            </Txt>
            <Txt variant="caption" tone="faint" style={{ marginTop: spacing.md }}>
              Версия {Constants.expoConfig?.version ?? '1.0.0'} · данные обновляются вместе с
              приложением
            </Txt>
          </Card>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  caption: { marginBottom: spacing.sm },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    fontSize: 15,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.lg,
  },
  ghost: {
    marginTop: spacing.lg,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
