import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CageView } from './CageView';
import { createCage, deleteCage, loadCages, loadWidgetCageId, setWidgetCage, type Cage } from './cageStore';

function confirmDelete(onOk: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm('この檻を削除しますか？')) onOk();
    return;
  }
  Alert.alert('この檻を削除しますか？', undefined, [
    { text: 'やめる', style: 'cancel' },
    { text: '削除', style: 'destructive', onPress: onOk },
  ]);
}

/** 自分で作った檻の一覧（横2列・正方形）。右下の＋で新規作成。 */
export function MyCagesScreen({ styleId }: { styleId: string }) {
  const insets = useSafeAreaInsets();
  const [cages, setCages] = useState<Cage[]>([]);
  const [widgetId, setWidgetId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setCages(await loadCages());
    setWidgetId(await loadWidgetCageId());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (res.canceled) return;
    await createCage(res.assets[0].uri);
    refresh();
  };

  const use = async (id: string) => {
    await setWidgetCage(id);
    refresh();
  };

  const remove = (id: string) =>
    confirmDelete(async () => {
      await deleteCage(id);
      refresh();
    });

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title}>マイ檻</Text>
      <Text style={styles.sub}>タップでウィジェットに設定・長押しで削除</Text>

      <FlatList
        data={cages}
        keyExtractor={(c) => c.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>右下の＋から檻を作ろう</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.cell} onPress={() => use(item.id)} onLongPress={() => remove(item.id)}>
            <CageView imageUri={item.uri} styleId={styleId} style={styles.cage} />
            {item.id === widgetId && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>ウィジェット</Text>
              </View>
            )}
          </Pressable>
        )}
      />

      <Pressable style={styles.fab} onPress={add} accessibilityLabel="新しい檻を作る">
        <Ionicons name="add" size={32} color="#14131a" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#14131a', paddingHorizontal: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', paddingHorizontal: 4 },
  sub: { color: '#8d8a9f', fontSize: 12, paddingHorizontal: 4, marginTop: 2 },
  list: { paddingTop: 14, paddingBottom: 96 },
  row: { gap: 12, marginBottom: 12 },
  cell: { flex: 1, maxWidth: '50%' },
  cage: { borderRadius: 16 },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: '#14131a', fontSize: 10, fontWeight: '800' },
  empty: { color: '#6f6c80', fontSize: 14, textAlign: 'center', marginTop: 80 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
});
