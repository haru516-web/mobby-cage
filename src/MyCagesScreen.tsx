import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CageView } from './CageView';
import { CAGE_STYLES, DEFAULT_STYLE_ID } from './cageStyles';
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
export function MyCagesScreen({ onHelp }: { onHelp: () => void }) {
  const insets = useSafeAreaInsets();
  const [cages, setCages] = useState<Cage[]>([]);
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null); // 選んだ直後でまだ保存していない画像
  const [pendingStyle, setPendingStyle] = useState(DEFAULT_STYLE_ID); // プレビューで選んでいる檻のデザイン
  const [saving, setSaving] = useState(false);

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
      quality: 1,
    });
    if (res.canceled) return;
    setPendingStyle(DEFAULT_STYLE_ID);
    setPending(res.assets[0].uri);
  };

  const save = async () => {
    if (!pending || saving) return;
    setSaving(true);
    try {
      await createCage(pending, pendingStyle);
      setPending(null);
      refresh();
    } finally {
      setSaving(false);
    }
  };

  const use = async (id: string) => {
    await setWidgetCage(id);
    refresh();
  };

  const current = cages.find((c) => c.id === widgetId) ?? null;

  const remove = (id: string) =>
    confirmDelete(async () => {
      await deleteCage(id);
      refresh();
    });

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>マイ檻</Text>
        <Pressable onPress={onHelp} hitSlop={12} accessibilityLabel="使い方">
          <Ionicons name="help-circle-outline" size={26} color="#8d8a9f" />
        </Pressable>
      </View>
      <Text style={styles.sub}>タップでウィジェットに設定・長押しで削除</Text>

      <FlatList
        data={cages}
        ListHeaderComponent={
          current ? (
            <View style={styles.current}>
              <Text style={styles.currentLabel}>ウィジェットに表示中</Text>
              <CageView imageUri={current.uri} styleId={current.styleId} style={styles.currentCage} />
              <Text style={styles.listLabel}>すべての檻</Text>
            </View>
          ) : null
        }
        keyExtractor={(c) => c.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>右下の＋から檻を作ろう</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.cell} onPress={() => use(item.id)} onLongPress={() => remove(item.id)}>
            <CageView imageUri={item.uri} styleId={item.styleId} style={styles.cage} />
            {item.id === widgetId && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>ウィジェット</Text>
              </View>
            )}
          </Pressable>
        )}
      />

      <Modal visible={pending !== null} animationType="slide" onRequestClose={() => setPending(null)}>
        <View style={[styles.preview, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.title}>プレビュー</Text>
          <Text style={styles.sub}>檻のデザインを選べます</Text>
          <View style={styles.previewCage}>
            <CageView imageUri={pending} styleId={pendingStyle} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleRow} contentContainerStyle={styles.styleRowContent}>
            {CAGE_STYLES.map((s) => (
              <Pressable key={s.id} onPress={() => setPendingStyle(s.id)} style={styles.styleItem}>
                <CageView
                  imageUri={pending}
                  styleId={s.id}
                  style={[styles.styleThumb, s.id === pendingStyle && styles.styleThumbActive]}
                />
                <Text style={[styles.styleName, s.id === pendingStyle && styles.styleNameActive]}>{s.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.previewButtons}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setPending(null)}>
              <Text style={styles.btnGhostText}>やめる</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnMain]} onPress={save} disabled={saving}>
              <Text style={styles.btnMainText}>{saving ? '保存中…' : 'この檻にする'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Pressable style={styles.fab} onPress={add} accessibilityLabel="新しい檻を作る">
        <Ionicons name="add" size={32} color="#14131a" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#14131a', paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 4 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', paddingHorizontal: 4 },
  sub: { color: '#8d8a9f', fontSize: 12, paddingHorizontal: 4, marginTop: 2 },
  current: { marginBottom: 6 },
  currentLabel: { color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 8, paddingHorizontal: 4 },
  currentCage: { width: '100%', borderRadius: 20 },
  listLabel: { color: '#8d8a9f', fontSize: 12, fontWeight: '700', marginTop: 20, marginBottom: 4, paddingHorizontal: 4 },
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
  preview: { flex: 1, backgroundColor: '#14131a', paddingHorizontal: 20 },
  previewCage: { marginTop: 20, width: '100%', maxWidth: 420, alignSelf: 'center' },
  styleRow: { marginTop: 16, flexGrow: 0 },
  styleRowContent: { gap: 10, paddingHorizontal: 2 },
  styleItem: { width: 72, alignItems: 'center' },
  styleThumb: { width: 72, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  styleThumbActive: { borderColor: '#fff' },
  styleName: { color: '#8d8a9f', fontSize: 10, fontWeight: '600', marginTop: 4 },
  styleNameActive: { color: '#fff' },
  previewButtons: { marginTop: 'auto', flexDirection: 'row', gap: 12, maxWidth: 420, width: '100%', alignSelf: 'center' },
  btn: { flex: 1, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  btnGhost: { backgroundColor: '#2c2a39' },
  btnGhostText: { color: '#e6e4f0', fontSize: 15, fontWeight: '700' },
  btnMain: { backgroundColor: '#fff', flex: 1.5 },
  btnMainText: { color: '#14131a', fontSize: 15, fontWeight: '800' },
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
