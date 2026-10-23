import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { LiveDot } from '@/components/LiveDot';
import { Txt } from '@/components/ui';
import { fromMinutes } from '@/domain/bells';
import { subjectMeta } from '@/domain/subjects';
import type { TimedLesson } from '@/domain/types';
import { radius, spacing, useTheme } from '@/theme';

export type RowState = 'past' | 'now' | 'upcoming' | 'future';

export const SubjectBadge = memo(function SubjectBadge({
  subject,
  size = 38,
  dimmed,
}: {
  subject: string;
  size?: number;
  dimmed?: boolean;
}) {
  const { accentFor } = useTheme();
  const meta = subjectMeta(subject);
  const accent = accentFor(meta.accent);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.34, // squircle-ish: scales with the badge
        backgroundColor: `${accent}${dimmed ? '16' : '26'}`,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons
        name={meta.icon}
        size={Math.round(size * 0.5)}
        color={accent}
        style={{ opacity: dimmed ? 0.6 : 1 }}
      />
    </View>
  );
});

function Rail({ accent, state, progress }: { accent: string; state: RowState; progress: number }) {
  const { palette } = useTheme();

  const fill = useAnimatedStyle(() => ({
    transform: [{ scaleY: withTiming(Math.min(1, Math.max(0, progress)), { duration: 500 }) }],
  }));

  if (state === 'now') {
    return (
      <View style={[styles.rail, { backgroundColor: `${accent}33` }]}>
        <Animated.View style={[styles.railFill, { backgroundColor: accent }, fill]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.rail,
        { backgroundColor: state === 'past' ? palette.border : `${accent}66` },
      ]}
    />
  );
}

export const LessonRow = memo(function LessonRow({
  lesson,
  state,
  progress = 0,
  index = 0,
  animate = true,
}: {
  lesson: TimedLesson;
  state: RowState;
  progress?: number;
  index?: number;
  /**
   * Off inside the week pager: five days mount at once, and forty staggered
   * entrances is real jank on a cheap phone for an effect nobody sees.
   */
  animate?: boolean;
}) {
  const { palette, accentFor } = useTheme();
  const meta = subjectMeta(lesson.subject);
  const accent = accentFor(meta.accent);
  const isPast = state === 'past';

  return (
    <Animated.View
      entering={animate ? FadeIn.delay(Math.min(index, 8) * 35).duration(260) : undefined}
      style={[
        styles.row,
        state === 'now' && {
          backgroundColor: palette.surface,
          borderRadius: radius.md,
        },
      ]}>
      <View style={styles.times}>
        {lesson.startMin !== null ? (
          <>
            <Txt variant="mono" tone={isPast ? 'faint' : 'dim'}>
              {fromMinutes(lesson.startMin)}
            </Txt>
            <Txt variant="mono" tone="faint" style={{ marginTop: 1 }}>
              {lesson.endMin !== null ? fromMinutes(lesson.endMin) : ''}
            </Txt>
          </>
        ) : (
          <Txt variant="mono" tone="faint">
            {lesson.n > 0 ? `${lesson.n}-й` : '—'}
          </Txt>
        )}
      </View>

      <Rail accent={accent} state={state} progress={progress} />

      <SubjectBadge subject={lesson.subject} dimmed={isPast} />

      <View style={styles.body}>
        <Txt variant="heading" numberOfLines={1} tone={isPast ? 'faint' : 'default'}>
          {meta.label}
        </Txt>
        <Txt variant="label" tone="faint" numberOfLines={1} style={{ marginTop: 2 }}>
          {[
            lesson.n > 0 ? `${lesson.n}-й урок` : 'перед уроками',
            lesson.room ? `каб. ${lesson.room}` : null,
            lesson.note ?? null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Txt>
      </View>

      {state === 'now' ? <LiveDot color={palette.success} /> : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingRight: spacing.sm,
    gap: spacing.md,
  },
  times: { width: 46, alignItems: 'flex-end' },
  rail: {
    width: 3,
    alignSelf: 'stretch',
    minHeight: 40,
    borderRadius: radius.pill,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  railFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.pill,
    transformOrigin: 'top',
  },
  body: { flex: 1, minWidth: 0 },
});
