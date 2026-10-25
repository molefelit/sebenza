import { theme } from '@/constants/sebenza-theme';
import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export function Screen({ children, maxWidth = 1100 }: { children: ReactNode; maxWidth?: number }) {
  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.column, { maxWidth }]}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.page },
  scroll: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  column: { width: '100%' },
});