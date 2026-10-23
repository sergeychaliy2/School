import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Press, Txt } from '@/components/ui';
import {
  addMonths,
  dateKey,
  isSameMonth,
  monthLabel,
  monthRows,
  parseDateKey,
  urgencyOf,
  visibleRows,
  type Urgency,
} from '@/domain/homework';
import { radius, spacing, useTheme } from '@/theme';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

type Counts = Map<string, { total: number; open: number }>;

/**
 * Month grid, written rather than pulled from a package: a calendar library
 * would add more to the APK than this file, and none of them speak Russian
 * week order (Monday first) without configuration anyway.
 *
 * Each day shows how many tasks are still open, coloured by how close the
 * deadline is — overdue and today are red, tomorrow amber.
 */
export function MonthCalendar({
  month,
  selected,
  counts,
  onSelect,
  onMonthChange,
  onClearDay,
}: {
  /** Any date inside the month being shown. */
  month: string;
  selected: string;
  counts: Counts;
  onSelect: (date: string) => void;
  onMonthChange: (month: string) => void;
  /** Long-press on a day with tasks. */
  onClearDay?: (date: string) => void;
}) {
  const { palette } = useTheme();
  const today = dateKey(new Date());
  const [expanded, setExpanded] = useState(false);

  const rows = useMemo(() => monthRows(month), [month]);
  const range = useMemo(
    () => visibleRows(month, today, selected, expanded),
    [month, today, selected, expanded],
  );
  const cells = useMemo(
    () => rows.slice(range.from, range.to + 1).flat(),
    [rows, range.from, range.to],
  );
  const hidden = rows.length - (range.to - range.from + 1);

  const urgencyColor = (urgency: Urgency): string => {
    switch (urgency) {
      case 'overdue':
      case 'today':
        return palette.danger;
      case 'soon':
        return palette.warning;
      case 'later':
        return palette.accent;
      default:
        return palette.success;
    }
  };

  return (
    <View>
      <View style={styles.head}>
        <Press
          onPress={() => onMonthChange(addMonths(month, -1))}
          accessibilityLabel="Предыдущий месяц"
          style={[styles.nav, { backgroundColor: palette.surface }]}>
          <Ionicons name="chevron-back" size={17} color={palette.textDim} />
        </Press>

        <Txt variant="heading">{monthLabel(month)}</Txt>

        <Press
          onPress={() => onMonthChange(addMonths(month, 1))}
          accessibilityLabel="Следующий месяц"
          style={[styles.nav, { backgroundColor: palette.surface }]}>
          <Ionicons name="chevron-forward" size={17} color={palette.textDim} />
        </Press>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((label, i) => (
          <View key={label} style={styles.cell}>
            <Txt variant="caption" tone={i > 4 ? 'faint' : 'dim'}>
              {label}
            </Txt>
          </View>
        ))}
      </View>

      <Animated.View key={month.slice(0, 7)} entering={FadeIn.duration(200)} style={styles.grid}>
        {cells.map((key) => {
          const inMonth = isSameMonth(key, month);
          const isSelected = key === selected;
          const isToday = key === today;
          const weekend = [0, 6].includes(parseDateKey(key).getDay());
          const entry = counts.get(key);
          const urgency = entry ? urgencyOf(key, entry.open, entry.total, today) : null;
          const badge = entry ? (entry.open > 0 ? entry.open : entry.total) : 0;
          const colour = urgency ? urgencyColor(urgency) : palette.accent;

          return (
            <Press
              key={key}
              onPress={() => onSelect(key)}
              onLongPress={entry && onClearDay ? () => onClearDay(key) : undefined}
              haptic="light"
              accessibilityLabel={
                entry ? `${key}, заданий ${entry.total}, не сделано ${entry.open}` : key
              }
              style={styles.cell}>
              <View
                style={[
                  styles.day,
                  isSelected && { backgroundColor: palette.accent },
                  !isSelected && isToday && { borderColor: palette.accent, borderWidth: 1.5 },
                ]}>
                <Txt
                  variant="label"
                  color={
                    isSelected
                      ? '#FFFFFF'
                      : !inMonth
                        ? palette.textFaint
                        : weekend
                          ? palette.textDim
                          : palette.text
                  }>
                  {parseDateKey(key).getDate()}
                </Txt>
              </View>

              {/* Count, not a dot: at a glance you see how much is waiting. */}
              <View
                style={[
                  styles.badge,
                  entry && {
                    backgroundColor: entry.open > 0 ? colour : 'transparent',
                    borderColor: entry.open > 0 ? colour : palette.success,
                    borderWidth: entry.open > 0 ? 0 : 1,
                  },
                ]}>
                {entry ? (
                  <Txt
                    variant="caption"
                    color={entry.open > 0 ? '#FFFFFF' : palette.success}
                    style={styles.badgeText}>
                    {badge}
                  </Txt>
                ) : null}
              </View>
            </Press>
          );
        })}
      </Animated.View>

      {hidden > 0 || expanded ? (
        <Press onPress={() => setExpanded((v) => !v)} haptic="light" style={styles.expand}>
          <Txt variant="caption" tone="accent">
            {expanded ? 'Свернуть' : 'Показать весь месяц'}
          </Txt>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={13}
            color={palette.accent}
          />
        </Press>
      ) : null}

      <Txt variant="caption" tone="faint" style={styles.hint}>
        Удерживай день, чтобы стереть его домашку
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  nav: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  day: {
    // Circle, so the filled selection and the outlined today read as the same
    // shape — a squarish radius made the filled one look like a box.
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, lineHeight: 14 },
  expand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  hint: { textAlign: 'center', marginTop: spacing.sm },
});
