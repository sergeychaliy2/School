import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SubjectBadge } from '@/components/LessonRow';
import { Divider, Press, Txt } from '@/components/ui';
import { shortTeacher } from '@/data/teachers';
import { fromMinutes } from '@/domain/bells';
import { subjectMeta } from '@/domain/subjects';
import { findTeachers, pickableFor, pinKey } from '@/domain/teachers';
import type { TimedLesson } from '@/domain/types';
import { useApp } from '@/store/app';
import { radius, spacing, useTheme } from '@/theme';

/**
 * Everything about one lesson in one place: when, where, who, and what was set.
 * Teacher and floor are not published by the school, so both are editable here
 * — filled in once, they stick on the device.
 */
export function LessonSheet({
  lesson,
  grade,
  homeworkText,
  onClose,
}: {
  lesson: TimedLesson | null;
  grade: string;
  homeworkText?: string;
  onClose: () => void;
}) {
  const { palette, accentFor } = useTheme();
  const insets = useSafeAreaInsets();
  const { teacherPins, setTeacherPin, roomFloors, setRoomFloor } = useApp();
  const [picking, setPicking] = useState(false);
  const [floorDraft, setFloorDraft] = useState<string | null>(null);

  if (!lesson) return null;

  const meta = subjectMeta(lesson.subject);
  const accent = accentFor(meta.accent);
  const key = pinKey(grade, lesson.subject);
  const { pinned, candidates } = findTeachers(grade, lesson.subject, teacherPins);
  const options = pickableFor(grade, lesson.subject);
  const floor = lesson.room ? roomFloors[lesson.room] : undefined;

  const teacherLine = pinned
    ? pinned.name
    : candidates.length === 1
      ? candidates[0].name
      : candidates.length > 1
        ? `${candidates.length} варианта — выбери своего`
        : 'Не указан';

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} style={[styles.scrim, { backgroundColor: palette.scrim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Закрыть" />
      </Animated.View>

      <Animated.View
        // Plain easing, not a spring: the bounce read as the panel jumping and
        // was tiring to look at.
        entering={SlideInDown.duration(260).easing(Easing.out(Easing.cubic))}
        style={[
          styles.sheet,
          {
            backgroundColor: palette.bgElevated,
            paddingBottom: insets.bottom + spacing.lg,
            borderColor: palette.border,
          },
        ]}>
        <View style={[styles.grabber, { backgroundColor: palette.border }]} />

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.head}>
            <SubjectBadge subject={lesson.subject} size={52} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt variant="title" numberOfLines={2}>
                {meta.label}
              </Txt>
              <Txt variant="label" tone="dim" style={{ marginTop: 2 }}>
                {[
                  lesson.n > 0 ? `${lesson.n}-й урок` : 'перед уроками',
                  lesson.startMin !== null && lesson.endMin !== null
                    ? `${fromMinutes(lesson.startMin)}–${fromMinutes(lesson.endMin)}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Txt>
            </View>
          </View>

          {/* Where */}
          <View style={[styles.block, { backgroundColor: palette.surface }]}>
            <View style={styles.rowBetween}>
              <View style={styles.rowIcon}>
                <Ionicons name="location-outline" size={18} color={accent} />
                <Txt variant="label" tone="dim">
                  Кабинет
                </Txt>
              </View>
              <Txt variant="heading">{lesson.room ?? '—'}</Txt>
            </View>

            {lesson.room ? (
              <>
                <Divider />
                <View style={styles.rowBetween}>
                  <View style={styles.rowIcon}>
                    <Ionicons name="layers-outline" size={18} color={accent} />
                    <Txt variant="label" tone="dim">
                      Этаж
                    </Txt>
                  </View>
                  <TextInput
                    value={floorDraft ?? floor ?? ''}
                    onChangeText={setFloorDraft}
                    onFocus={() => setFloorDraft(floor ?? '')}
                    onBlur={() => {
                      if (floorDraft !== null) setRoomFloor(lesson.room!, floorDraft);
                      setFloorDraft(null);
                    }}
                    placeholder="указать"
                    placeholderTextColor={palette.textFaint}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={[styles.floorInput, { color: palette.text, backgroundColor: palette.card }]}
                  />
                </View>
              </>
            ) : null}
          </View>

          {/* Who */}
          <Press onPress={() => setPicking((v) => !v)} style={[styles.block, { backgroundColor: palette.surface }]}>
            <View style={styles.rowBetween}>
              <View style={styles.rowIcon}>
                <Ionicons name="person-outline" size={18} color={accent} />
                <Txt variant="label" tone="dim">
                  Учитель
                </Txt>
              </View>
              <View style={styles.rowIcon}>
                <Txt variant="heading" tone={pinned || candidates.length === 1 ? 'default' : 'faint'}>
                  {pinned || candidates.length === 1 ? shortTeacher(teacherLine) : teacherLine}
                </Txt>
                <Ionicons
                  name={picking ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={palette.textFaint}
                />
              </View>
            </View>
          </Press>

          {picking ? (
            <Animated.View entering={FadeIn.duration(160)} style={styles.options}>
              {options.map((teacher) => {
                const selected = pinned?.name === teacher.name;
                return (
                  <Press
                    key={teacher.name}
                    onPress={() => {
                      setTeacherPin(key, selected ? null : teacher.name);
                      setPicking(false);
                    }}
                    style={[
                      styles.option,
                      {
                        backgroundColor: selected ? palette.accentSoft : palette.surface,
                        borderColor: selected ? palette.accent : 'transparent',
                      },
                    ]}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt variant="label" numberOfLines={1}>
                        {teacher.name}
                      </Txt>
                      <Txt variant="caption" tone="faint" numberOfLines={1}>
                        {teacher.role}
                      </Txt>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={18} color={palette.accent} />
                    ) : null}
                  </Press>
                );
              })}
              <Txt variant="caption" tone="faint" style={{ marginTop: spacing.xs }}>
                Школа публикует предметы педагогов, но не классы. Выбери своего — запомнится.
              </Txt>
            </Animated.View>
          ) : null}

          {homeworkText ? (
            <View style={[styles.block, { backgroundColor: palette.surface }]}>
              <View style={styles.rowIcon}>
                <Ionicons name="create-outline" size={18} color={accent} />
                <Txt variant="label" tone="dim">
                  Домашка
                </Txt>
              </View>
              <Txt variant="body" style={{ marginTop: spacing.sm }}>
                {homeworkText}
              </Txt>
            </View>
          ) : null}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '82%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.lg },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  block: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  rowIcon: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  floorInput: {
    minWidth: 56,
    height: 34,
    borderRadius: radius.sm,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
  },
  options: { gap: spacing.sm, marginBottom: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
