import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { SubjectBadge } from '@/components/LessonRow';
import { LiveDot } from '@/components/LiveDot';
import { Card, Pill, Txt } from '@/components/ui';
import { formatDuration, fromMinutes, mealForBreak } from '@/domain/bells';
import type { NowState } from '@/domain/day';
import { subjectMeta } from '@/domain/subjects';
import { DAY_NAMES } from '@/domain/types';
import { radius, spacing, useTheme } from '@/theme';

function ProgressBar({ progress, accent }: { progress: number; accent: string }) {
  const { palette } = useTheme();
  // Scaling beats animating a width string: it stays on the UI thread.
  const fill = useAnimatedStyle(() => ({
    transform: [{ scaleX: withTiming(Math.min(1, Math.max(0, progress)), { duration: 600 }) }],
  }));

  return (
    <View style={[styles.track, { backgroundColor: palette.surface }]}>
      <Animated.View style={[styles.fill, { backgroundColor: accent }, fill]} />
    </View>
  );
}

/** The hero card: one glance answers "what now, and what next". */
export function NowCard({ state, grade }: { state: NowState; grade: string }) {
  const { palette, accentFor } = useTheme();

  if (state.kind === 'weekend' || state.kind === 'free') {
    const title = state.kind === 'weekend' ? 'Сегодня выходной' : 'Сегодня уроков нет';
    return (
      <Animated.View entering={FadeIn.duration(320)}>
        <Card style={styles.card}>
          <Pill label="ОТДЫХ" />
          <Txt variant="display" style={{ marginTop: spacing.md }}>
            {title}
          </Txt>
          <Txt variant="body" tone="dim" style={{ marginTop: spacing.sm }}>
            Следующие уроки в {DAY_NAMES[state.nextDay].toLowerCase()}.
          </Txt>
        </Card>
      </Animated.View>
    );
  }

  if (state.kind === 'after') {
    return (
      <Animated.View entering={FadeIn.duration(320)}>
        <Card style={styles.card}>
          <Pill label="ГОТОВО" />
          <Txt variant="display" style={{ marginTop: spacing.md }}>
            Уроки закончились
          </Txt>
          {/* Phrased to sidestep gender agreement: «последним был музыка» is wrong,
              and the next school day is not always tomorrow. */}
          <Txt variant="body" tone="dim" style={{ marginTop: spacing.sm }}>
            Последний урок — {subjectMeta(state.last.subject).label.toLowerCase()}. Следующие
            уроки в {DAY_NAMES[state.nextDay].toLowerCase()}.
          </Txt>
        </Card>
      </Animated.View>
    );
  }

  if (state.kind === 'before') {
    const meta = subjectMeta(state.next.subject);
    const accent = accentFor(meta.accent);
    return (
      <Animated.View entering={FadeIn.duration(320)}>
        <Card style={[styles.card, { borderColor: `${accent}55` }]}>
          <Pill label="СКОРО НАЧАЛО" tone="accent" />
          <Txt variant="display" style={{ marginTop: spacing.md }}>
            Через {formatDuration(state.minutesUntil)}
          </Txt>
          <View style={styles.subjectRow}>
            <SubjectBadge subject={state.next.subject} size={42} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt variant="heading" numberOfLines={1}>
                {meta.label}
              </Txt>
              <Txt variant="label" tone="dim" numberOfLines={1}>
                {[
                  state.next.startMin !== null ? `в ${fromMinutes(state.next.startMin)}` : null,
                  state.next.room ? `каб. ${state.next.room}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Txt>
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  }

  if (state.kind === 'break') {
    const meta = subjectMeta(state.next.subject);
    const accent = accentFor(meta.accent);
    const meal = mealForBreak(state.prev.n, grade);
    return (
      <Animated.View entering={FadeIn.duration(320)}>
        <Card style={[styles.card, { borderColor: `${accent}55` }]}>
          <View style={styles.headRow}>
            <Pill label={meal ? meal.toUpperCase() : 'ПЕРЕМЕНА'} tone="accent" />
            <Txt variant="mono" tone="accent">
              {formatDuration(state.minutesLeft)}
            </Txt>
          </View>
          <Txt variant="display" style={{ marginTop: spacing.md }}>
            {meal ?? 'Перемена'}
          </Txt>
          <ProgressBar progress={state.progress} accent={palette.accent} />
          <View style={styles.subjectRow}>
            <SubjectBadge subject={state.next.subject} size={42} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt variant="label" tone="faint">
                Дальше
              </Txt>
              <Txt variant="heading" numberOfLines={1}>
                {meta.label}
              </Txt>
              <Txt variant="label" tone="dim" numberOfLines={1}>
                {[
                  state.next.startMin !== null ? fromMinutes(state.next.startMin) : null,
                  state.next.room ? `каб. ${state.next.room}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Txt>
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  }

  const meta = subjectMeta(state.current.subject);
  const accent = accentFor(meta.accent);

  return (
    <Animated.View entering={FadeIn.duration(320)}>
      <Card style={[styles.card, { borderColor: `${accent}66`, backgroundColor: `${accent}12` }]}>
        <View style={styles.headRow}>
          <View style={styles.liveRow}>
            <LiveDot color={palette.success} size={7} />
            <Pill label="СЕЙЧАС ИДЁТ" tone="live" />
          </View>
          <Txt variant="mono" color={palette.success}>
            осталось {formatDuration(state.minutesLeft)}
          </Txt>
        </View>

        <View style={styles.subjectRow}>
          <Animated.View entering={ZoomIn.springify().damping(14)}>
            <SubjectBadge subject={state.current.subject} size={52} />
          </Animated.View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt variant="title" numberOfLines={2}>
              {meta.label}
            </Txt>
            <Txt variant="label" tone="dim" numberOfLines={1} style={{ marginTop: 2 }}>
              {[
                `${state.current.n}-й урок`,
                state.current.room ? `каб. ${state.current.room}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Txt>
          </View>
        </View>

        <ProgressBar progress={state.progress} accent={accent} />

        <View style={styles.headRow}>
          <Txt variant="mono" tone="faint">
            {state.current.startMin !== null ? fromMinutes(state.current.startMin) : ''}
          </Txt>
          <Txt variant="mono" tone="faint">
            {state.current.endMin !== null ? fromMinutes(state.current.endMin) : ''}
          </Txt>
        </View>

        {state.next ? (
          <View style={[styles.nextRow, { borderTopColor: palette.border }]}>
            <Txt variant="label" tone="faint">
              Дальше
            </Txt>
            <Txt variant="label" numberOfLines={1} style={{ flex: 1, textAlign: 'right' }}>
              {subjectMeta(state.next.subject).label}
              {state.next.room ? ` · каб. ${state.next.room}` : ''}
            </Txt>
          </View>
        ) : (
          <View style={[styles.nextRow, { borderTopColor: palette.border }]}>
            <Txt variant="label" tone="faint">
              Это последний урок
            </Txt>
          </View>
        )}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  fill: { height: 8, width: '100%', borderRadius: radius.pill, transformOrigin: 'left' },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
