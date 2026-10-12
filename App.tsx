import { useEffect, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CHARACTERS, findCharacter } from './src/characters';
import { CageView } from './src/CageView';
import { loadSelectedId, saveSelectedId } from './src/selection';

const BG = '#14131a';
const CARD = '#211f2b';

// iPhone 標準的なウィジェットの大きさ(pt)
const WIDGET_SMALL = { width: 158, height: 158, borderRadius: 22 };
const WIDGET_MEDIUM = { width: 338, height: 158, borderRadius: 22 };
const WIDGET_LARGE = { width: 338, height: 354, borderRadius: 22 };

export default function App() {
  const [appliedId, setAppliedId] = useState<string>(CHARACTERS[0].id); // ウィジェットに設定済み
  const [previewId, setPreviewId] = useState<string>(CHARACTERS[0].id); // いま見ているキャラ
  const [helpOpen, setHelpOpen] = useState(false);
  const [justApplied, setJustApplied] = useState(false);

  useEffect(() => {
    loadSelectedId().then((id) => {
      if (id) {
        setAppliedId(id);
        setPreviewId(id);
      }
    });
  }, []);

  const preview = findCharacter(previewId);
  const isApplied = previewId === appliedId;

  const apply = async () => {
    if (isApplied) return;
    setAppliedId(previewId);
    await saveSelectedId(previewId);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 1800);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.title}>檻キャラ</Text>
          <Pressable style={styles.helpBtn} onPress={() => setHelpOpen(true)} accessibilityLabel="ウィジェットの追加方法">
            <Text style={styles.helpText}>？</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll}>
          <View style={styles.previewWrap}>
            <CageView character={preview} />
          </View>

          <Text style={styles.name}>{preview.name}</Text>
          <Text style={styles.catch}>{preview.catchphrase}</Text>

          <Pressable
            onPress={apply}
            disabled={isApplied}
            style={({ pressed }) => [
              styles.applyBtn,
              { backgroundColor: isApplied ? '#34323f' : preview.accent },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={[styles.applyText, { color: isApplied ? '#a9a6b8' : '#1b1a24' }]}>
              {isApplied ? (justApplied ? '檻に入れました ✓' : '入居中') : 'この子を檻に入れる'}
            </Text>
          </Pressable>
          <Text style={styles.note}>
            ウィジェットに表示されるのは「入居中」のキャラです
          </Text>

          <Text style={styles.sectionTitle}>ウィジェットでの見え方</Text>
          <View style={styles.homeScreen}>
            <View style={styles.widgetRow}>
              <CageView character={preview} fixed style={WIDGET_SMALL} />
              <CageView character={preview} fixed style={WIDGET_SMALL} />
            </View>
            <View style={styles.widgetRow}>
              <CageView character={preview} fixed wide style={WIDGET_MEDIUM} />
            </View>
            <View style={styles.widgetRow}>
              <CageView character={preview} fixed style={WIDGET_LARGE} />
            </View>
            <Text style={styles.homeCaption}>小 ／ 中 ／ 大</Text>
          </View>

          <Text style={styles.sectionTitle}>キャラを選ぶ</Text>
          <View style={styles.grid}>
            {CHARACTERS.map((c) => {
              const focused = c.id === previewId;
              return (
                <Pressable key={c.id} style={styles.cell} onPress={() => setPreviewId(c.id)}>
                  <View
                    style={[
                      styles.card,
                      focused && { borderColor: c.accent, backgroundColor: '#2c2a39' },
                    ]}
                  >
                    <View style={styles.thumbBox}>
                      <Image source={c.image} style={styles.thumb} resizeMode="contain" />
                    </View>
                    <Text style={styles.cardName} numberOfLines={1}>{c.name}</Text>
                    {c.id === appliedId && (
                      <View style={[styles.badge, { backgroundColor: c.accent }]}>
                        <Text style={styles.badgeText}>入居中</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <Modal visible={helpOpen} transparent animationType="fade" onRequestClose={() => setHelpOpen(false)}>
          <Pressable style={styles.overlay} onPress={() => setHelpOpen(false)}>
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>ウィジェットの追加方法</Text>
              <Text style={styles.step}>1. ホーム画面の何もないところを長押し</Text>
              <Text style={styles.step}>2. 左上の「＋」をタップ</Text>
              <Text style={styles.step}>3. 「檻キャラ」を選んでサイズを決める</Text>
              <Text style={styles.step}>4. 「ウィジェットを追加」→ 完了</Text>
              <Text style={styles.sheetFoot}>キャラを変えたら、ウィジェットも自動で入れ替わります。</Text>
              <Pressable style={styles.closeBtn} onPress={() => setHelpOpen(false)}>
                <Text style={styles.closeText}>閉じる</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, alignItems: 'center' },
  header: {
    width: '100%',
    maxWidth: 520,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: 1 },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CARD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: { color: '#cfcce0', fontSize: 17, fontWeight: '700' },
  scrollView: { flex: 1, width: '100%', maxWidth: 520 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
  previewWrap: {
    alignSelf: 'stretch',
    maxWidth: 360,
    marginTop: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  name: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 18 },
  catch: { color: '#a9a6b8', fontSize: 14, marginTop: 4 },
  applyBtn: {
    marginTop: 18,
    alignSelf: 'stretch',
    maxWidth: 360,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  applyText: { fontSize: 17, fontWeight: '800' },
  note: { color: '#7d7a8e', fontSize: 12, marginTop: 10 },
  sectionTitle: {
    alignSelf: 'flex-start',
    paddingLeft: 5,
    color: '#cfcce0',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 28,
    marginBottom: 10,
  },
  homeScreen: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: '#2d3a55',
    borderRadius: 28,
    paddingVertical: 18,
    gap: 18,
  },
  widgetRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  homeCaption: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  grid: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '33.333%', minWidth: 0, padding: 5 },
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  thumbBox: { width: 84, height: 84 },
  thumb: { width: '100%', height: '100%' },
  cardName: { color: '#e6e4f0', fontSize: 12, fontWeight: '600', marginTop: 4 },
  badge: { position: 'absolute', top: 6, right: 6, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#1b1a24', fontSize: 10, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 380, backgroundColor: CARD, borderRadius: 20, padding: 22 },
  sheetTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 14 },
  step: { color: '#e6e4f0', fontSize: 15, marginBottom: 8 },
  sheetFoot: { color: '#8d8a9f', fontSize: 12, marginTop: 6 },
  closeBtn: { marginTop: 18, backgroundColor: '#34323f', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  closeText: { color: '#fff', fontWeight: '700' },
});
