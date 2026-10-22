import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CageCell } from './CageCell';
import { AdjustableCage } from './AdjustableCage';
import { CageView, DEFAULT_ADJUST, type Adjust } from './CageView';
import { CAGE_STYLES, DEFAULT_STYLE_ID } from './cageStyles';
import { removeBackground } from './cutout';
import { LockSheet, type LockRequest } from './LockSheet';
import { useLock } from './lockStore';
import { createCage, deleteCage, loadCages, loadWidgetCageId, setWidgetCage, updateAdjust, type Cage } from './cageStore';

function confirmDelete(onOk: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm('この檻を削除しますか？')) onOk();
    return;
  }
  Alert.alert('この檻を削除しますか？', undefined, [
    { text: 'キャンセル', style: 'cancel' },
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
  const [adjust, setAdjust] = useState<Adjust>(DEFAULT_ADJUST); // 檻の中の画像の位置・サイズ
  const [adjustId, setAdjustId] = useState<string | null>(null); // 既存の檻の調整中ならその id
  const [mode, setMode] = useState<'original' | 'cutout'>('original'); // そのまま使う / 背景を透過して使う
  const [cutoutUri, setCutoutUri] = useState<string | null>(null);
  const [cutting, setCutting] = useState(false);
  const [cutError, setCutError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const lock = useLock();
  const locked = lock.hasPin && !lock.unlocked; // パスワード設定済みで、まだ解除していない
  const [lockReq, setLockReq] = useState<LockRequest | null>(null);
  const [editing, setEditing] = useState(false); // 長押しで入る編集モード（ゆらゆら＋×で削除）

  const previewUri = mode === 'cutout' && cutoutUri ? cutoutUri : pending;

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
    setAdjustId(null);
    setAdjust(DEFAULT_ADJUST);
    setPendingStyle(DEFAULT_STYLE_ID);
    setMode('original');
    setCutoutUri(null);
    setCutError(null);
    setPending(res.assets[0].uri);
  };

  // 透過は初回だけ処理して、結果を使い回す
  const chooseMode = async (next: 'original' | 'cutout') => {
    if (cutting) return;
    setCutError(null);
    if (next === 'original' || cutoutUri || !pending) {
      setMode(next);
      return;
    }
    setCutting(true);
    try {
      setCutoutUri(await removeBackground(pending));
      setMode('cutout');
    } catch (e) {
      setMode('original');
      setCutError(e instanceof Error ? e.message : '背景を透過できませんでした');
    } finally {
      setCutting(false);
    }
  };

  const startAdjust = (c: Cage) => {
    setAdjustId(c.id);
    setAdjust(c.adjust);
    setPendingStyle(c.styleId);
    setMode('original');
    setCutoutUri(null);
    setCutError(null);
    setPending(c.uri);
  };

  const save = async () => {
    if (!pending || saving) return;
    setSaving(true);
    try {
      if (adjustId) await updateAdjust(adjustId, adjust);
      else await createCage(previewUri ?? pending, pendingStyle, adjust);
      setPending(null);
      refresh();
    } finally {
      setSaving(false);
    }
  };

  // ロック中は、パスワードを解除してから続きの操作をやる
  const guard = (action: () => void) => {
    if (locked) setLockReq({ kind: 'unlock', then: action });
    else action();
  };

  const use = (id: string) => {
    if (editing) {
      setEditing(false);
      return;
    }
    if (id === widgetId) return; // すでにウィジェットの檻
    guard(async () => {
      await setWidgetCage(id);
      refresh();
    });
  };

  const onLockPress = () => {
    if (!lock.hasPin) setLockReq({ kind: 'setup' });
    else if (locked) setLockReq({ kind: 'unlock' });
    else setLockReq({ kind: 'manage' });
  };

  const current = cages.find((c) => c.id === widgetId) ?? null;

  const remove = (id: string) =>
    guard(() =>
      confirmDelete(async () => {
        await deleteCage(id);
        const rest = await loadCages();
        if (rest.length === 0) setEditing(false);
        refresh();
      })
    );

  return (
    <View
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      // 編集中は、画面のどこをタップしても解除する（×・完了・檻のタップはそれぞれの処理を優先。スクロールは邪魔しない）
      onStartShouldSetResponder={() => editing}
      onResponderRelease={() => setEditing(false)}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>マイ檻</Text>
        {editing ? (
          <Pressable onPress={() => setEditing(false)} hitSlop={12}>
            <Text style={styles.done}>完了</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onHelp} hitSlop={12} accessibilityLabel="使い方">
            <Ionicons name="help-circle-outline" size={26} color="#8d8a9f" />
          </Pressable>
        )}
      </View>
      <Text style={styles.sub}>
        {editing ? '右上の×で削除・「完了」で終了' : 'タップでウィジェットに設定・長押しで編集'}
      </Text>

      <FlatList
        data={cages}
        ListHeaderComponent={
          current ? (
            <View style={styles.current}>
              <Text style={styles.currentLabel}>ウィジェットに表示中</Text>
              <View>
                <CageView imageUri={current.uri} styleId={current.styleId} adjust={current.adjust} style={styles.currentCage} />
                <Pressable style={styles.adjustBtn} onPress={() => guard(() => startAdjust(current))} hitSlop={8} accessibilityLabel="位置とサイズを調整">
                  <Ionicons name="resize" size={20} color="#fff" />
                </Pressable>
                <Pressable
                  style={styles.lockBtn}
                  onPress={onLockPress}
                  hitSlop={8}
                  accessibilityLabel={!lock.hasPin ? 'ロックを設定' : locked ? 'ロックを解除' : 'ロックの設定'}
                >
                  <Ionicons
                    name={locked ? 'lock-closed' : lock.hasPin ? 'lock-open' : 'lock-open-outline'}
                    size={20}
                    color={locked ? '#fff' : lock.hasPin ? '#7be0a8' : '#fff'}
                  />
                </Pressable>
              </View>
              <Text style={styles.listLabel}>すべての檻</Text>
            </View>
          ) : null
        }
        keyExtractor={(c) => c.id}
        extraData={editing}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>右下の＋から檻を作ろう</Text>}
        renderItem={({ item }) => (
          <CageCell
            cage={item}
            active={item.id === widgetId}
            editing={editing}
            onPress={() => use(item.id)}
            onLongPress={() => guard(() => setEditing(true))}
            onDelete={() => remove(item.id)}
          />
        )}
      />

      <LockSheet request={lockReq} onClose={() => setLockReq(null)} />

      <Modal visible={pending !== null} animationType="slide" onRequestClose={() => setPending(null)}>
        <View style={[styles.preview, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.title}>{adjustId ? '位置とサイズ' : 'プレビュー'}</Text>
          <Text style={styles.sub}>{adjustId ? '画像をドラッグして動かせます' : '檻のデザインを選べます'}</Text>
          <View style={styles.previewCage}>
            <AdjustableCage imageUri={previewUri} styleId={pendingStyle} adjust={adjust} onChange={setAdjust} />
            {cutting && (
              <View style={styles.cuttingOverlay}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.cuttingText}>背景を透過中…</Text>
              </View>
            )}
          </View>
          {!adjustId && (
          <View style={styles.modeRow}>
            {(
              [
                ['original', 'そのまま使う'],
                ['cutout', '背景を透過して使う'],
              ] as const
            ).map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => chooseMode(key)}
                style={[styles.modeBtn, mode === key && styles.modeBtnActive]}
              >
                <Text style={[styles.modeText, mode === key && styles.modeTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          )}
          {cutError && <Text style={styles.cutError}>{cutError}</Text>}
          {!adjustId && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleRow} contentContainerStyle={styles.styleRowContent}>
            {CAGE_STYLES.map((s) => (
              <Pressable key={s.id} onPress={() => setPendingStyle(s.id)} style={styles.styleItem}>
                <CageView
                  imageUri={previewUri}
                  styleId={s.id}
                  adjust={adjust}
                  style={[styles.styleThumb, s.id === pendingStyle && styles.styleThumbActive]}
                />
                <Text style={[styles.styleName, s.id === pendingStyle && styles.styleNameActive]}>{s.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          )}
          <View style={styles.previewButtons}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setPending(null)}>
              <Text style={styles.btnGhostText}>やめる</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnMain]} onPress={save} disabled={saving}>
              <Text style={styles.btnMainText}>{saving ? '保存中…' : adjustId ? '保存' : 'この檻にする'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {!editing && (
      <Pressable style={styles.fab} onPress={add} accessibilityLabel="新しい檻を作る">
        <Ionicons name="add" size={32} color="#14131a" />
      </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#14131a', paddingHorizontal: 16 },
  lockBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20,19,26,0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustBtn: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20,19,26,0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  done: { color: '#fff', fontSize: 15, fontWeight: '800' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 4 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', paddingHorizontal: 4 },
  sub: { color: '#8d8a9f', fontSize: 12, paddingHorizontal: 4, marginTop: 2 },
  current: { marginBottom: 6 },
  currentLabel: { color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 8, paddingHorizontal: 4 },
  currentCage: { width: '100%', borderRadius: 20 },
  listLabel: { color: '#8d8a9f', fontSize: 12, fontWeight: '700', marginTop: 20, marginBottom: 4, paddingHorizontal: 4 },
  list: { paddingTop: 14, paddingBottom: 96 },
  row: { gap: 12, marginBottom: 12 },
  preview: { flex: 1, backgroundColor: '#14131a', paddingHorizontal: 20 },
  previewCage: { marginTop: 20, width: '100%', maxWidth: 420, alignSelf: 'center' },
  cuttingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    backgroundColor: 'rgba(20,19,26,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cuttingText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  modeBtn: { flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center', backgroundColor: '#2c2a39' },
  modeBtnActive: { backgroundColor: '#fff' },
  modeText: { color: '#c9c6d8', fontSize: 13, fontWeight: '700' },
  modeTextActive: { color: '#14131a' },
  cutError: { color: '#ff9aa8', fontSize: 12, textAlign: 'center', marginTop: 8 },
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
