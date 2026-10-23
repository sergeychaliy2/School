import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  type SharedValue,
  FadeInDown,
  runOnJS,
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

import { GradePicker } from '@/components/GradePicker';
import { LessonRow } from '@/components/LessonRow';
import { LessonSheet } from '@/components/LessonSheet';
import { Card, Divider, Press, Screen, Txt } from '@/components/ui';
import { breakAfter, mealForBreak } from '@/domain/bells';
import { dayKeyOf } from '@/domain/day';
import { lessonsCount } from '@/domain/format';
import { gradeLabel, lessonsFor, ritualsFor } from '@/domain/schedule';
import { DAY_KEYS, DAY_NAMES, DAY_SHORT, type DayKey, type TimedLesson } from '@/domain/types';
import { useTimedDay } from '@/hooks/useTimedDay';
import { useApp } from '@/store/app';
import { radius, spacing, useTheme } from '@/theme';

const STRIP_PADDING = spacing.xs;

/**
 * Day selector. The highlight is a single pill that slides with the pager
 * instead of a background toggled per tab — that way it tracks the finger
 * mid-swipe and always keeps the rounded shape.
 */
function DayStrip({
  scrollX,
  pageWidth,
  activeIndex,
  today,
  onPick,
}: {
  scrollX: SharedValue<number>;
  pageWidth: number;
  activeIndex: number;
  today: DayKey | null;
  onPick: (index: number) => void;
}) {
  const { palette } = useTheme();
  const [stripWidth, setStripWidth] = useState(0);

  const tabWidth = stripWidth > 0 ? (stripWidth - STRIP_PADDING * 2) / DAY_KEYS.length : 0;

  const pill = useAnimatedStyle(() => {
    const progress = pageWidth > 0 ? scrollX.value / pageWidth : 0;
    return {
      width: tabWidth,
      transform: [{ translateX: progress * tabWidth }],
      opacity: tabWidth > 0 ? 1 : 0,
    };
  });

  return (
    <View
      onLayout={(event) => setStripWidth(event.nativeEvent.layout.width)}
      style={[styles.strip, { backgroundColor: palette.surface }]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.pill, { backgroundColor: palette.accent }, pill]}
      />

      {DAY_KEYS.map((key, index) => {
        const selected = index === activeIndex;
        return (
          <Press
            key={key}
            onPress={() => onPick(index)}
            accessibilityLabel={DAY_NAMES[key]}
            style={styles.tabTouch}>
            <View style={styles.tabInner}>
              <Txt variant="label" color={selected ? '#FFFFFF' : palette.textDim}>
                {DAY_SHORT[key]}
              </Txt>
              <View
                style={[
                  styles.todayDot,
                  key === today && {
                    backgroundColor: selected ? '#FFFFFF' : palette.accent,
                  },
                ]}
              />
            </View>
          </Press>
        );
      })}
    </View>
  );
}

function DayPage({
  grade,
  day,
  width,
  onPick,
}: {
  grade: string;
  day: DayKey;
  width: number;
  onPick: (lesson: TimedLesson) => void;
}) {
  const { palette } = useTheme();
  const { bells } = useApp();
  const lessons = useTimedDay(grade, day);
  const rituals = ritualsFor(day).filter((r) => r !== 'Утренняя зарядка');

  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHead}>
        <Txt variant="heading">{DAY_NAMES[day]}</Txt>
        <Txt variant="label" tone="faint">
          {lessonsCount(lessonsFor(grade, day).length)}
        </Txt>
      </View>

      {lessons.length === 0 ? (
        <Card>
          <Txt variant="body" tone="dim">
            В этот день уроков нет.
          </Txt>
        </Card>
      ) : (
        <Card padded={false} style={{ overflow: 'hidden' }}>
          {rituals.map((ritual) => (
            <View key={ritual}>
              <View style={styles.ritualRow}>
                <View style={[styles.ritualChip, { backgroundColor: palette.accentSoft }]}>
                  <Txt variant="caption" tone="accent">
                    {ritual}
                  </Txt>
                </View>
              </View>
              <Divider />
            </View>
          ))}

          {lessons.map((lesson, index) => {
            const gap = breakAfter(bells, lesson.n);
            const meal = mealForBreak(lesson.n, grade);
            const showGap = gap !== null && gap >= 15 && index < lessons.length - 1;

            return (
              <View key={`${lesson.n}-${lesson.subject}`}>
                {index > 0 ? <Divider inset={62} /> : null}
                <Press onPress={() => onPick(lesson)} haptic="light" style={styles.rowWrap}>
                  <LessonRow lesson={lesson} index={index} state="future" animate={false} />
                </Press>
                {showGap ? (
                  <View style={styles.gapRow}>
                    <Txt variant="caption" tone="faint">
                      {`перемена ${gap} мин${meal ? ` · ${meal.toLowerCase()}` : ''}`}
                    </Txt>
                  </View>
                ) : null}
              </View>
            );
          })}
        </Card>
      )}
    </ScrollView>
  );
}

export default function WeekScreen() {
  const { activeGrade, setGrade } = useApp();
  const { width } = useWindowDimensions();
  const today = dayKeyOf(new Date());
  const grade = activeGrade!;

  const pager = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const startIndex = today ? Math.max(0, DAY_KEYS.indexOf(today)) : 0;
  const [index, setIndex] = useState(startIndex);
  const landed = useRef(false);
  const [sheet, setSheet] = useState<TimedLesson | null>(null);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  // Derive the selected tab from scroll position so the labels flip at the
  // half-way point of a swipe rather than only once it settles.
  useDerivedValue(() => {
    if (width <= 0) return;
    const next = Math.round(scrollX.value / width);
    if (next !== index && next >= 0 && next < DAY_KEYS.length) {
      runOnJS(setIndex)(next);
    }
  }, [width, index]);

  const goTo = useCallback(
    (target: number) => {
      runOnUI(() => {
        'worklet';
        scrollTo(pager, target * width, 0, true);
      })();
    },
    [pager, width],
  );

  // Jump to today once, and only after the pages have actually been laid out —
  // scrolling before that silently does nothing and leaves Monday on screen.
  const landOnToday = useCallback(
    (contentWidth: number) => {
      if (landed.current || contentWidth <= 0 || width <= 0) return;
      landed.current = true;
      scrollX.value = startIndex * width;
      runOnUI(() => {
        'worklet';
        scrollTo(pager, startIndex * width, 0, false);
      })();
    },
    [pager, scrollX, startIndex, width],
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Animated.View entering={FadeInDown.duration(300)}>
          <Txt variant="display">Неделя</Txt>
          <Txt variant="label" tone="faint" style={{ marginTop: 2 }}>
            {gradeLabel(grade)} · листай влево и вправо
          </Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(300)} style={{ marginTop: spacing.lg }}>
          <Txt variant="label" tone="dim" style={{ marginBottom: spacing.xs }}>
            Класс
          </Txt>
          <GradePicker value={grade} onChange={setGrade} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={{ marginTop: spacing.md }}>
          <DayStrip
            scrollX={scrollX}
            pageWidth={width}
            activeIndex={index}
            today={today}
            onPick={goTo}
          />
        </Animated.View>
      </View>

      <Animated.ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onContentSizeChange={landOnToday}
        style={{ flex: 1 }}>
        {DAY_KEYS.map((key) => (
          <DayPage key={`${grade}-${key}`} grade={grade} day={key} width={width} onPick={setSheet} />
        ))}
      </Animated.ScrollView>

      <LessonSheet lesson={sheet} grade={grade} onClose={() => setSheet(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  strip: {
    flexDirection: 'row',
    padding: STRIP_PADDING,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  pill: {
    position: 'absolute',
    top: STRIP_PADDING,
    bottom: STRIP_PADDING,
    left: STRIP_PADDING,
    borderRadius: radius.sm,
  },
  tabTouch: { flex: 1 },
  tabInner: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, gap: 3 },
  todayDot: { width: 4, height: 4, borderRadius: 2 },
  pageContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rowWrap: { paddingHorizontal: spacing.md },
  ritualRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.md },
  ritualChip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  gapRow: { paddingLeft: 62, paddingRight: spacing.md, paddingBottom: spacing.sm },
});
