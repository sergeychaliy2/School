import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Press, Txt } from '@/components/ui';
import { radius, spacing, useTheme } from '@/theme';

export function ScreenHeader({ title }: { title: string }) {
  const router = useRouter();
  const { palette } = useTheme();

  return (
    <View style={styles.header}>
      <Press
        onPress={() => router.back()}
        accessibilityLabel="Назад"
        style={[styles.back, { backgroundColor: palette.surface }]}>
        <Ionicons name="chevron-back" size={20} color={palette.text} />
      </Press>
      <Txt variant="title">{title}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
