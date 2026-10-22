import { useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CageView, DEFAULT_ADJUST, type Adjust } from './CageView';

const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;
const STEP = 0.1;
const clamp = (v: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(v * 100) / 100));

/** 檻の上で画像をドラッグして位置を、−/＋でサイズを調整できるプレビュー。 */
export function AdjustableCage({
  imageUri,
  styleId,
  adjust,
  onChange,
}: {
  imageUri: string | null;
  styleId: string;
  adjust: Adjust;
  onChange: (a: Adjust) => void;
}) {
  const [width, setWidth] = useState(1);
  // PanResponder は作り直さないので、最新値は ref 経由で読む
  const latest = useRef({ adjust, width, onChange });
  latest.current = { adjust, width, onChange };
  // ドラッグ(1本指)とピンチ(2本指)の基準。指の本数が変わるたびに取り直す
  const base = useRef({ adjust: DEFAULT_ADJUST, fingers: 0, dist: 0, dx: 0, dy: 0 });

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        base.current = { adjust: latest.current.adjust, fingers: 0, dist: 0, dx: 0, dy: 0 };
      },
      onPanResponderMove: (e, g) => {
        const { width: w, adjust: cur, onChange: change } = latest.current;
        const t = e.nativeEvent.touches;
        const fingers = t.length >= 2 ? 2 : 1;
        const dist = fingers === 2 ? Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY) : 0;
        const bs = base.current;
        if (fingers !== bs.fingers) {
          base.current = { adjust: cur, fingers, dist, dx: g.dx, dy: g.dy };
          return;
        }
        if (fingers === 2) {
          if (bs.dist < 1) return;
          change({ ...bs.adjust, scale: clamp(bs.adjust.scale * (dist / bs.dist)) });
        } else {
          change({ ...bs.adjust, x: bs.adjust.x + (g.dx - bs.dx) / w, y: bs.adjust.y + (g.dy - bs.dy) / w });
        }
      },
    })
  ).current;

  const setScale = (scale: number) => onChange({ ...adjust, scale: clamp(scale) });

  return (
    <View>
      <View {...pan.panHandlers} onLayout={(e) => setWidth(e.nativeEvent.layout.width || 1)}>
        <CageView imageUri={imageUri} styleId={styleId} adjust={adjust} />
      </View>
      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={() => setScale(adjust.scale - STEP)} accessibilityLabel="小さく">
          <Ionicons name="remove" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.label}>{Math.round(adjust.scale * 100)}%</Text>
        <Pressable style={styles.btn} onPress={() => setScale(adjust.scale + STEP)} accessibilityLabel="大きく">
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
        <Pressable style={[styles.btn, styles.reset]} onPress={() => onChange(DEFAULT_ADJUST)}>
          <Text style={styles.resetText}>リセット</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>ドラッグで位置・2本指でサイズ（−/＋でも調整できます）</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 12 },
  btn: { height: 36, minWidth: 36, borderRadius: 18, backgroundColor: '#2c2a39', alignItems: 'center', justifyContent: 'center' },
  label: { color: '#fff', fontSize: 14, fontWeight: '700', minWidth: 48, textAlign: 'center' },
  reset: { paddingHorizontal: 14, marginLeft: 8 },
  resetText: { color: '#c9c6d8', fontSize: 12, fontWeight: '700' },
  hint: { color: '#8d8a9f', fontSize: 11, textAlign: 'center', marginTop: 6 },
});
