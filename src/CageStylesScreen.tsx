import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CageView } from './CageView';
import { CAGE_STYLES } from './cageStyles';

/** 使える檻（檻のデザイン）の一覧。横2列・正方形。タップで切り替え、マイ檻とウィジェットに反映される。 */
export function CageStylesScreen({
  styleId,
  onSelect,
}: {
  styleId: string;
  onSelect: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title}>使える檻</Text>
      <Text style={styles.sub}>タップで檻のデザインを切り替え</Text>
      <FlatList
        data={CAGE_STYLES}
        keyExtractor={(s) => s.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const active = item.id === styleId;
          return (
            <Pressable style={styles.cell} onPress={() => onSelect(item.id)}>
              <CageView imageUri={null} styleId={item.id} style={[styles.thumb, active && styles.thumbActive]} />
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.name}</Text>
                {active && <Text style={styles.using}>使用中</Text>}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#14131a', paddingHorizontal: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', paddingHorizontal: 4 },
  sub: { color: '#8d8a9f', fontSize: 12, paddingHorizontal: 4, marginTop: 2 },
  list: { paddingTop: 14, paddingBottom: 24 },
  row: { gap: 12, marginBottom: 12 },
  cell: { flex: 1, maxWidth: '50%' },
  thumb: { borderRadius: 16, borderWidth: 3, borderColor: 'transparent' },
  thumbActive: { borderColor: '#fff' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingHorizontal: 4 },
  name: { color: '#e6e4f0', fontSize: 12, fontWeight: '600' },
  using: { color: '#14131a', backgroundColor: '#fff', fontSize: 10, fontWeight: '800', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
});
