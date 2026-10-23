import Ionicons from '@expo/vector-icons/Ionicons';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Card, Divider, Press, Screen, Txt } from '@/components/ui';
import { SCHOOL } from '@/data/school';
import { scheduleDoc } from '@/domain/schedule';
import { checkForScheduleUpdate, type UpdateResult } from '@/domain/updates';
import { radius, spacing, useTheme } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function Row({
  icon,
  title,
  subtitle,
  onPress,
  trailing,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  const { palette } = useTheme();

  return (
    <Press onPress={onPress} disabled={!onPress} haptic="light" style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: palette.surface }]}>
        <Ionicons name={icon} size={18} color={palette.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt variant="heading" numberOfLines={1}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="label" tone="faint" numberOfLines={2} style={{ marginTop: 2 }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {trailing ?? (onPress ? <Ionicons name="chevron-forward" size={17} color={palette.textFaint} /> : null)}
    </Press>
  );
}

export default function SchoolScreen() {
  const { palette } = useTheme();
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<UpdateResult | null>(null);

  const openUrl = (url: string) => {
    WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url).catch(() => {}));
  };

  const runCheck = async () => {
    setChecking(true);
    setResult(await checkForScheduleUpdate());
    setChecking(false);
  };

  const resultTone =
    result?.status === 'stale'
      ? palette.warning
      : result?.status === 'current'
        ? palette.success
        : palette.danger;

  const resultText =
    result?.status === 'stale'
      ? `На сайте новые сканы: ${result.changed.join(', ')}. Откройте страницу расписания, чтобы свериться.`
      : result?.status === 'current'
        ? 'Расписание в приложении совпадает с тем, что висит на сайте школы.'
        : result?.status === 'error'
          ? result.message
          : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(300)}>
          <Txt variant="display">Школа</Txt>
          <Txt variant="label" tone="faint" style={{ marginTop: 2 }}>
            {SCHOOL.name}
          </Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(300)}>
          <Txt variant="label" tone="dim" style={styles.caption}>
            Связаться
          </Txt>
          <Card padded={false} style={styles.card}>
            <Row
              icon="call-outline"
              title={SCHOOL.phoneLabel}
              subtitle="Приёмная школы"
              onPress={() => Linking.openURL(`tel:${SCHOOL.phone}`).catch(() => {})}
            />
            <Divider inset={60} />
            <Row
              icon="mail-outline"
              title={SCHOOL.email}
              subtitle="Электронная почта"
              onPress={() => Linking.openURL(`mailto:${SCHOOL.email}`).catch(() => {})}
            />
            <Divider inset={60} />
            <Row
              icon="person-outline"
              title={SCHOOL.director}
              subtitle={`Директор · приём ${SCHOOL.directorHours}`}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(300)}>
          <Txt variant="label" tone="dim" style={styles.caption}>
            Ссылки
          </Txt>
          <Card padded={false} style={styles.card}>
            {SCHOOL.links.map((link, index) => (
              <View key={link.url}>
                {index > 0 ? <Divider inset={60} /> : null}
                <Row icon="open-outline" title={link.label} onPress={() => openUrl(link.url)} />
              </View>
            ))}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(300)}>
          <Txt variant="label" tone="dim" style={styles.caption}>
            Расписание
          </Txt>
          <Card>
            <Txt variant="body" tone="dim">
              Школа публикует расписание сканами PDF, поэтому приложение не может обновлять его
              само. Но оно может спросить у сайта, не поменялись ли эти сканы.
            </Txt>

            <Press
              onPress={runCheck}
              disabled={checking}
              haptic="medium"
              style={[styles.button, { backgroundColor: palette.accent }]}>
              {checking ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Txt variant="heading" color="#FFFFFF">
                  Проверить обновления
                </Txt>
              )}
            </Press>

            {resultText ? (
              <Animated.View entering={FadeIn.duration(240)}>
                <Txt variant="label" color={resultTone} style={{ marginTop: spacing.md }}>
                  {resultText}
                </Txt>
              </Animated.View>
            ) : null}

            <Press
              onPress={() => openUrl(SCHOOL.schedulePage)}
              style={[styles.buttonGhost, { borderColor: palette.border }]}>
              <Txt variant="heading" tone="dim">
                Открыть расписание на сайте
              </Txt>
            </Press>

            <Txt variant="caption" tone="faint" style={{ marginTop: spacing.md }}>
              В приложении — расписание, утверждённое {scheduleDoc.approvedOn.split('-').reverse().join('.')}.
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
  card: { overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: spacing.lg,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGhost: {
    marginTop: spacing.sm,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
