import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { SubjectBadge } from '@/components/LessonRow';
import { MonthCalendar } from '@/components/MonthCalendar';
import { Card, Divider, Press, Screen, Txt } from '@/components/ui';
import { formatDay } from '@/domain/format';
import {
  countsByDate,
  dateKey,
  dayKeyForDate,
  parseDateKey,
  tasksFor,
  tasksForLesson,
  type Homework,
} from '@/domain/homework';
import { lessonsFor } from '@/domain/schedule';
import { subjectMeta } from '@/domain/subjects';
import { dropPhoto, dropPhotos, keepPhoto } from '@/lib/photos';
import { DAY_NAMES } from '@/domain/types';
import { useApp } from '@/store/app';
import { radius, spacing, useTheme } from '@/theme';

/** One numbered task: text, photos, done, delete. */
function TaskRow({
  task,
  index,
  editing,
  onEdit,
  onSave,
  onToggle,
  onDelete,
  onPhotos,
}: {
  task: Homework;
  index: number;
  editing: boolean;
  onEdit: () => void;
  onSave: (text: string) => void;
  onToggle: () => void;
  onDelete: () => void;
  onPhotos: (photos: string[]) => void;
}) {
  const { palette } = useTheme();
  const [draft, setDraft] = useState<string | null>(null);
  const photos = task.photos ?? [];

  const attach = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Нет доступа',
        fromCamera
          ? 'Разреши приложению камеру, чтобы сфотографировать задание.'
          : 'Разреши доступ к галерее, чтобы прикрепить фото.',
      );
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsMultipleSelection: true });

    if (result.canceled) return;
    // Copy into app storage first, so the attachment outlives the gallery.
    const kept = await Promise.all(result.assets.map((asset) => keepPhoto(asset.uri)));
    onPhotos([...photos, ...kept]);
  };

  return (
    <Animated.View layout={LinearTransition.duration(180)} style={styles.taskWrap}>
      <View style={styles.taskRow}>
        <View style={[styles.number, { backgroundColor: palette.surface }]}>
          <Txt variant="caption" tone={task.done ? 'faint' : 'dim'}>
            {index + 1}
          </Txt>
        </View>

        <Press onPress={onEdit} haptic="light" style={styles.taskMain}>
          <Txt
            variant="body"
            tone={task.done ? 'faint' : 'default'}
            style={task.done ? { textDecorationLine: 'line-through' } : undefined}>
            {task.text || (photos.length > 0 ? 'Задание на фото' : 'Пусто — нажми, чтобы записать')}
          </Txt>
        </Press>

        <Press
          onPress={onToggle}
          haptic="medium"
          accessibilityLabel={task.done ? 'Отметить невыполненным' : 'Отметить выполненным'}
          style={styles.iconBtn}>
          <Ionicons
            name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={task.done ? palette.success : palette.textFaint}
          />
        </Press>

        <Press onPress={onDelete} haptic="medium" accessibilityLabel="Удалить задание" style={styles.iconBtn}>
          <Ionicons name="close" size={18} color={palette.textFaint} />
        </Press>
      </View>

      {photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoStrip}>
          {photos.map((uri, i) => (
            <View key={uri} style={styles.photoBox}>
              <Image source={{ uri }} style={styles.photo} />
              <Press
                onPress={() => {
                  dropPhoto(uri);
                  onPhotos(photos.filter((_, j) => j !== i));
                }}
                accessibilityLabel="Убрать фото"
                style={[styles.photoRemove, { backgroundColor: palette.scrim }]}>
                <Ionicons name="close" size={12} color="#FFFFFF" />
              </Press>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {editing ? (
        <Animated.View entering={FadeIn.duration(160)} style={styles.editor}>
          <TextInput
            value={draft ?? task.text}
            onChangeText={setDraft}
            autoFocus
            multiline
            placeholder="Что задали?"
            placeholderTextColor={palette.textFaint}
            style={[
              styles.input,
              { backgroundColor: palette.surface, color: palette.text, borderColor: palette.accent },
            ]}
          />

          <View style={styles.editorActions}>
            <Press onPress={() => attach(true)} style={[styles.ghostBtn, { borderColor: palette.border }]}>
              <Ionicons name="camera-outline" size={16} color={palette.textDim} />
              <Txt variant="label" tone="dim">
                Снять
              </Txt>
            </Press>
            <Press onPress={() => attach(false)} style={[styles.ghostBtn, { borderColor: palette.border }]}>
              <Ionicons name="image-outline" size={16} color={palette.textDim} />
              <Txt variant="label" tone="dim">
                Галерея
              </Txt>
            </Press>
            <View style={{ flex: 1 }} />
            {/* Always tappable — closing an untouched row must not be a trap. */}
            <Press
              onPress={() => {
                onSave(draft ?? task.text);
                setDraft(null);
              }}
              haptic="medium"
              style={[styles.saveBtn, { backgroundColor: palette.accent }]}>
              <Txt variant="label" color="#FFFFFF">
                Готово
              </Txt>
            </Press>
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

/** A lesson with all of its tasks. */
function LessonBlock({
  subject,
  lessonN,
  room,
  tasks,
  editingId,
  onEditing,
  grade,
  date,
}: {
  subject: string;
  lessonN: number;
  room: string | null;
  tasks: Homework[];
  editingId: string | null;
  onEditing: (id: string | null) => void;
  grade: string;
  date: string;
}) {
  const { palette } = useTheme();
  const { addHomework, editHomework, toggleHomework, removeHomework, setHomeworkPhotos } = useApp();

  const add = () => {
    addHomework({ grade, date, subject, lessonN, text: '' });
    // The new row is the newest one; open it on the next render.
    onEditing('__new__');
  };

  // Resolve the placeholder once the store has produced a real id.
  const pendingId = editingId === '__new__' ? tasks[tasks.length - 1]?.id ?? null : editingId;

  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <SubjectBadge subject={subject} size={36} dimmed={tasks.length === 0} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt variant="heading" numberOfLines={1}>
            {subjectMeta(subject).label}
          </Txt>
          <Txt variant="label" tone="faint" numberOfLines={1} style={{ marginTop: 2 }}>
            {[`${lessonN}-й урок`, room ? `каб. ${room}` : null].filter(Boolean).join(' · ')}
          </Txt>
        </View>
        <Press onPress={add} haptic="light" accessibilityLabel="Добавить задание" style={styles.iconBtn}>
          <Ionicons name="add-circle-outline" size={24} color={palette.accent} />
        </Press>
      </View>

      {tasks.map((task, i) => (
        <TaskRow
          key={task.id}
          task={task}
          index={i}
          editing={pendingId === task.id}
          onEdit={() => onEditing(pendingId === task.id ? null : task.id)}
          onSave={(text) => {
            editHomework(task.id, text);
            onEditing(null);
          }}
          onToggle={() => toggleHomework(task.id)}
          onDelete={() => {
            dropPhotos(task.photos);
            removeHomework(task.id);
          }}
          onPhotos={(photos) => setHomeworkPhotos(task.id, photos)}
        />
      ))}
    </View>
  );
}

export default function HomeworkScreen() {
  const { palette } = useTheme();
  const { activeGrade, homework, clearHomework } = useApp();
  const grade = activeGrade!;

  const [selected, setSelected] = useState(() => dateKey(new Date()));
  const [month, setMonth] = useState(selected);
  const [editingId, setEditingId] = useState<string | null>(null);

  const dayKey = dayKeyForDate(selected);
  const lessons = dayKey ? lessonsFor(grade, dayKey) : [];
  const tasks = useMemo(() => tasksFor(homework, grade, selected), [homework, grade, selected]);
  const counts = useMemo(() => countsByDate(homework, grade), [homework, grade]);
  const open = tasks.filter((task) => !task.done).length;

  const confirmClearDay = (date: string) => {
    const doomed = homework.filter((t) => t.grade === grade && t.date === date);
    const count = doomed.length;
    if (count === 0) return;
    Alert.alert(
      'Стереть домашку?',
      `${formatDay(parseDateKey(date))} — заданий: ${count}. Отменить будет нельзя.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Стереть',
          style: 'destructive',
          onPress: () => {
            doomed.forEach((task) => dropPhotos(task.photos));
            clearHomework({ date });
          },
        },
      ],
    );
  };

  // Tasks whose lesson is no longer in the schedule still need somewhere to live.
  const orphans = tasks.filter(
    (task) => !lessons.some((l) => l.n === task.lessonN && l.subject === task.subject),
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(300)}>
          <Txt variant="display">Домашка</Txt>
          <Txt variant="label" tone="faint" style={{ marginTop: 2 }}>
            {tasks.length === 0
              ? 'На этот день пока ничего не записано'
              : open === 0
                ? `Всё сделано — ${tasks.length}`
                : `${open} из ${tasks.length} не сделано`}
          </Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(300)}>
          <Card>
            <MonthCalendar
              month={month}
              selected={selected}
              counts={counts}
              onSelect={(date) => {
                setSelected(date);
                setMonth(date);
                setEditingId(null);
              }}
              onMonthChange={setMonth}
              onClearDay={confirmClearDay}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(300)}>
          <View style={styles.sectionHead}>
            <Txt variant="heading">
              {dayKey ? DAY_NAMES[dayKey] : 'Выходной'}, {formatDay(parseDateKey(selected))}
            </Txt>
            {tasks.length > 0 ? (
              <Press onPress={() => confirmClearDay(selected)} haptic="medium">
                <Txt variant="label" color={palette.danger}>
                  Очистить
                </Txt>
              </Press>
            ) : null}
          </View>

          {lessons.length === 0 && orphans.length === 0 ? (
            <Card>
              <Txt variant="body" tone="dim">
                В этот день уроков нет. Задания можно записать на учебный день — выбери его в
                календаре.
              </Txt>
            </Card>
          ) : (
            <Card padded={false} style={{ overflow: 'hidden' }}>
              {lessons.map((lesson, index) => (
                <View key={`${lesson.n}-${lesson.subject}`}>
                  {index > 0 ? <Divider inset={spacing.md} /> : null}
                  <LessonBlock
                    subject={lesson.subject}
                    lessonN={lesson.n}
                    room={lesson.room}
                    tasks={tasksForLesson(homework, grade, selected, lesson.n, lesson.subject)}
                    editingId={editingId}
                    onEditing={setEditingId}
                    grade={grade}
                    date={selected}
                  />
                </View>
              ))}
            </Card>
          )}

          <Txt variant="caption" tone="faint" style={styles.hint}>
            Задания и фото хранятся только на телефоне.
          </Txt>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  block: { paddingVertical: spacing.sm },
  blockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  taskWrap: { paddingLeft: spacing.md + 36 + spacing.md, paddingRight: spacing.sm },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  number: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskMain: { flex: 1, minWidth: 0, paddingVertical: spacing.sm },
  iconBtn: { padding: spacing.xs },
  editor: { gap: spacing.sm, paddingBottom: spacing.sm },
  editorActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    minHeight: 68,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    fontSize: 15,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    height: 32,
  },
  saveBtn: {
    paddingHorizontal: spacing.lg,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoStrip: { paddingBottom: spacing.sm },
  photoBox: { marginRight: spacing.sm },
  photo: { width: 64, height: 64, borderRadius: radius.sm },
  photoRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { marginTop: spacing.md, textAlign: 'center' },
});
