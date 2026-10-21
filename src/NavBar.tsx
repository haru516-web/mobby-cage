import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type Tab = 'mine' | 'styles';

const TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'mine', label: 'マイ檻', icon: 'lock-closed' },
  { key: 'styles', label: '使える檻', icon: 'grid' },
];

export function NavBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((t) => {
        const active = t.key === tab;
        return (
          <Pressable key={t.key} style={styles.btn} onPress={() => onChange(t.key)} accessibilityRole="tab">
            <Ionicons name={t.icon} size={24} color={active ? '#ffffff' : '#6f6c80'} />
            <Text style={[styles.label, active && styles.labelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#1b1a24',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#34323f',
    paddingTop: 8,
  },
  btn: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2 },
  label: { color: '#6f6c80', fontSize: 11, fontWeight: '600' },
  labelActive: { color: '#ffffff' },
});
