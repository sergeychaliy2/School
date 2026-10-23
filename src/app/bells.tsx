import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Card, Divider, Press, Screen, Txt } from '@/components/ui';
import {
  DEFAULT_BELLS,
  breakAfter,
  isValidTime,
  mealLabelFor,
  toMinutes,
  type Bell,
} from '@/domain/bells';
import { useApp } from '@/store/app';
import { radius, spacing, useTheme } from '@/theme';

function TimeField({
  value,
  onCommit,
  label,
}: {
  value: string;
  onCommit: (next: string) => void;
  label: string;
}) {
  const { palette } = useTheme();
  // While unfocused the field mirrors the store, so a reset elsewhere shows up
  // here without any syncing effect.
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? value;
  const focused = draft !== null;
  const valid = isValidTime(shown);

  return (
    <TextInput
      value={shown}
      onChangeText={setDraft}
      onFocus={() => setDraft(value)}
      onBlur={() => {
        if (draft !== null && isValidTime(draft)) onCommit(draft);
        setDraft(null);
      }}
      accessibilityLabel={label}
      keyboardType="numbers-and-punctuation"
      maxLength={5}
      style={[
        styles.time,
        {
          backgroundColor: palette.surface,
          color: valid ? palette.text : palette.danger,
          borderColor: focused ? palette.accent : 'transparent',
        },
      ]}
    />
  );
}

export default function BellsScreen() {
  const { palette } = useTheme();
  const { bells, setBells, resetBells, bellsTouched } = useApp();

  const update = (n: number, field: 'start' | 'end', next: string) => {
    setBells(bells.map((bell) => (bell.n === n ? { ...bell, [field]: next } : bell)));
  };

  const broken = bells.filter((bell) => toMinutes(bell.end) <= toMinutes(bell.start));

  return (
    <Screen edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Звонки" />

        <Animated.View entering={FadeInDown.duration(280)}>
          <Card>
            <Txt variant="body" tone="dim">
              Уроки идут по 40 минут. Время взято с объявления в школе — на сайте его нет. Если
              звонки поменяются, поправь их здесь, и «сейчас идёт» снова станет точным.
            </Txt>
          </Card>
        </Animated.View>

        {broken.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(220)}>
            <Card style={{ borderColor: palette.danger }}>
              <Txt variant="label" color={palette.danger}>
                У {broken.length === 1 ? 'одного урока' : `${broken.length} уроков`} конец раньше
                начала — проверь время.
              </Txt>
            </Card>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(60).duration(280)}>
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {bells.map((bell: Bell, index) => {
              const gap = breakAfter(bells, bell.n);
              const meal = mealLabelFor(bell.n);

              return (
                <View key={bell.n}>
                  {index > 0 ? <Divider inset={spacing.lg} /> : null}

                  <View style={styles.row}>
                    <View style={styles.rowLabel}>
                      <Txt variant="heading">{bell.n === 0 ? 'Зарядка' : `${bell.n} урок`}</Txt>
                    </View>
                    <TimeField
                      value={bell.start}
                      label={`Начало ${bell.n} урока`}
                      onCommit={(next) => update(bell.n, 'start', next)}
                    />
                    <Txt variant="label" tone="faint">
                      —
                    </Txt>
                    <TimeField
                      value={bell.end}
                      label={`Конец ${bell.n} урока`}
                      onCommit={(next) => update(bell.n, 'end', next)}
                    />
                  </View>

                  {gap !== null && gap > 0 ? (
                    <View style={styles.gapRow}>
                      <Txt variant="caption" tone="faint">
                        перемена {gap} мин{meal ? ` · ${meal}` : ''}
                      </Txt>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </Card>
        </Animated.View>

        {bellsTouched ? (
          <Animated.View entering={FadeInDown.duration(220)}>
            <Press
              onPress={resetBells}
              style={[styles.ghost, { borderColor: palette.border }]}>
              <Txt variant="heading" tone="dim">
                Вернуть время из школы
              </Txt>
            </Press>
          </Animated.View>
        ) : (
          <Txt variant="caption" tone="faint" style={{ textAlign: 'center' }}>
            Сейчас стоит время с объявления: с {DEFAULT_BELLS[0].start} до{' '}
            {DEFAULT_BELLS[DEFAULT_BELLS.length - 1].end}.
          </Txt>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  rowLabel: { flex: 1, minWidth: 0 },
  time: {
    width: 76,
    height: 42,
    borderRadius: radius.sm,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  gapRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  ghost: {
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
