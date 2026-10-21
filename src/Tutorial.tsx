import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STEPS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'image',
    title: '好きな画像を選ぶ',
    body: 'マイ檻の右下の「＋」から、写真を選びます。背景が透明な画像だと、きれいに入ります。',
  },
  {
    icon: 'lock-closed',
    title: '檻に閉じ込める',
    body: 'プレビューで檻のデザインを選んで、「この檻にする」で保存します。',
  },
  {
    icon: 'phone-portrait',
    title: 'ウィジェットに置く',
    body: 'ホーム画面を長押し →「＋」→「おりっこ」を追加。アプリで檻をタップすると、ウィジェットの中身が変わります。',
  },
];

/** 使い方案内（初回起動時と、「？」から開いたとき）。 */
export function Tutorial({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  // 開くたびに1ページ目から（閉じるアニメーション中は表示を変えない）
  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  const close = onClose;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={close}>
      <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}>
        <Pressable style={styles.skip} onPress={close} hitSlop={12}>
          <Text style={styles.skipText}>{last ? '' : 'スキップ'}</Text>
        </Pressable>

        <View style={styles.body}>
          <View style={styles.iconWrap}>
            <Ionicons name={step.icon} size={72} color="#fff" />
          </View>
          <Text style={styles.stepNo}>
            {index + 1} / {STEPS.length}
          </Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.text}>{step.body}</Text>
        </View>

        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <Pressable style={styles.button} onPress={() => (last ? close() : setIndex(index + 1))}>
          <Text style={styles.buttonText}>{last ? 'はじめる' : '次へ'}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#14131a', paddingHorizontal: 28 },
  skip: { alignSelf: 'flex-end', minHeight: 24 },
  skipText: { color: '#8d8a9f', fontSize: 14, fontWeight: '600' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  iconWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#2c2a39',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepNo: { color: '#8d8a9f', fontSize: 12, fontWeight: '700' },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  text: { color: '#c9c6d8', fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 320 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3a3848' },
  dotActive: { backgroundColor: '#fff' },
  button: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  buttonText: { color: '#14131a', fontSize: 16, fontWeight: '800' },
});
