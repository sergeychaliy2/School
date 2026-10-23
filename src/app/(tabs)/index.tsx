import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { LessonRow, type RowState } from '@/components/LessonRow';
import { LessonSheet } from '@/components/LessonSheet';
import { NowCard } from '@/components/NowCard';
import { Card, Divider, Press, Screen, Txt } from '@/components/ui';
import { minutesNow, dayKeyOf, resolveNow } from '@/domain/day';
import { formatDay, greetingFor, lessonsCount, shortName } from '@/domain/format';
import { gradeLabel, noteForGrade, ritualsFor } from '@/domain/schedule';
import { DAY_NAMES, type TimedLesson } from '@/domain/types';
import { useNow } from '@/hooks/useNow';
import { useTimedDay } from '@/hooks/useTimedDay';
import { tasksFor, dateKey } from '@/domain/homework';
import { useApp } from '@/store/app';
import { radius, spacing, useTheme } from '@/theme';

export default function TodayScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const { profile, activeGrade, homework } = useApp();
  const [sheet, setSheet] = useState<TimedLesson | null>(null);
  const now = useNow();

  const dayKey = dayKeyOf(now);
  const grade = activeGrade!; // the tabs layout redirects when this is null
  const lessons = useTimedDay(grade, dayKey);
  const state = useMemo(() => resolveNow(lessons, now), [lessons, now]);

  const minutes = minutesNow(now);
  const activeNumber =
    state.kind === 'lesson' ? state.current.n : state.kind === 'break' ? state.next.n : -1;

  const rowState = (endMin: number | null, n: number): RowState => {
    if (n === activeNumber && state.kind === 'lesson') return 'now';
    if (endMin !== null && endMin <= minutes) return 'past';
    if (n === activeNumber) return 'upcoming';
    return 'future';
  };

  const rituals = dayKey ? ritualsFor(dayKey).filter((r) => r !== 'Утренняя зарядка') : [];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(320)} style={styles.header}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt variant="label" tone="dim">
              {profile ? `${greetingFor(now)},` : 'Расписание'}
            </Txt>
            <Txt variant="display" numberOfLines={1}>
              {profile ? shortName(profile.name) : gradeLabel(grade)}
            </Txt>
            <Txt variant="label" tone="faint" style={{ marginTop: 2 }}>
              {profile ? `${gradeLabel(grade)} · ` : ''}
              {dayKey ? DAY_NAMES[dayKey].toLowerCase() : 'выходной'}, {formatDay(now)}
            </Txt>
          </View>

          <Press
            onPress={() => router.push('/settings')}
            accessibilityLabel="Настройки"
            style={[styles.gear, { backgroundColor: palette.surface }]}>
            <Ionicons name="settings-outline" size={20} color={palette.textDim} />
          </Press>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(320)}>
          <NowCard state={state} grade={grade} />
        </Animated.View>

        {lessons.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(120).duration(320)}>
            <View style={styles.sectionHead}>
              <Txt variant="heading">Сегодня</Txt>
              <Txt variant="label" tone="faint">
                {lessonsCount(lessons.length - 1)}
              </Txt>
            </View>

            <Card padded={false} style={styles.listCard}>
              {rituals.length > 0 ? (
                <>
                  <View style={styles.ritualRow}>
                    {rituals.map((ritual) => (
                      <View
                        key={ritual}
                        style={[styles.ritualChip, { backgroundColor: palette.accentSoft }]}>
                        <Txt variant="caption" tone="accent">
                          {ritual}
                        </Txt>
                      </View>
                    ))}
                  </View>
                  <Divider />
                </>
              ) : null}

              {lessons.map((lesson, index) => (
                <View key={`${lesson.n}-${lesson.subject}`}>
                  {index > 0 ? <Divider inset={62} /> : null}
                  <Press onPress={() => setSheet(lesson)} haptic="light" style={styles.rowWrap}>
                    <LessonRow
                      lesson={lesson}
                      index={index}
                      state={rowState(lesson.endMin, lesson.n)}
                      progress={state.kind === 'lesson' && state.current.n === lesson.n ? state.progress : 0}
                    />
                  </Press>
                </View>
              ))}
            </Card>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(180).duration(320)}>
          <Txt variant="caption" tone="faint" style={styles.note}>
            {noteForGrade(grade)}
          </Txt>
        </Animated.View>
      </ScrollView>

      <LessonSheet
        lesson={sheet}
        grade={grade}
        homeworkText={
          sheet
            ? tasksFor(homework, grade, dateKey(now)).find(
                (task) => task.lessonN === sheet.n && task.subject === sheet.subject,
              )?.text
            : undefined
        }
        onClose={() => setSheet(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  gear: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  listCard: { overflow: 'hidden' },
  rowWrap: { paddingHorizontal: spacing.md },
  ritualRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.md },
  ritualChip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  note: { textAlign: 'center', paddingHorizontal: spacing.lg },
});
