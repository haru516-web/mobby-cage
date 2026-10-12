import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CHARACTERS, findCharacter } from './characters';

/** キャラ選択。スクロールなしで17体が収まる 4列グリッド。タップで即入居。 */
export function CharaScreen({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const current = findCharacter(selectedId);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>キャラ</Text>
        <Text style={styles.sub}>タップで檻に入れます</Text>
      </View>

      <View style={styles.current}>
        <Image source={current.image} style={styles.currentImg} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={styles.currentName}>{current.name}</Text>
          <Text style={styles.currentCatch}>{current.catchphrase}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {CHARACTERS.map((c) => {
          const active = c.id === selectedId;
          return (
            <Pressable key={c.id} style={styles.cell} onPress={() => onSelect(c.id)}>
              <View style={[styles.card, active && { borderColor: c.accent, backgroundColor: '#2c2a39' }]}>
                <View style={styles.thumbBox}>
                  <Image source={c.image} style={styles.thumb} resizeMode="contain" />
                </View>
                <Text style={styles.cardName} numberOfLines={1}>{c.name}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#14131a', paddingHorizontal: 12 },
  header: { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingHorizontal: 4, paddingBottom: 8 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  sub: { color: '#8d8a9f', fontSize: 12 },
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#211f2b',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },
  currentImg: { width: 64, height: 64 },
  currentName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  currentCatch: { color: '#a9a6b8', fontSize: 12, marginTop: 2 },
  // 残りの高さを 4列×5行 で等分（スクロール不要）
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 8 },
  cell: { width: '25%', height: '20%', padding: 3 },
  card: {
    flex: 1,
    backgroundColor: '#211f2b',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  thumbBox: { flex: 1, alignSelf: 'stretch' },
  thumb: { width: '100%', height: '100%' },
  cardName: { color: '#e6e4f0', fontSize: 10, fontWeight: '600', marginTop: 2 },
});
