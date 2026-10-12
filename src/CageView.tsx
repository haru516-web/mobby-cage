import { Image, StyleSheet, View, type ViewStyle } from 'react-native';
import type { Character } from './characters';

const BG = require('../assets/bg.png');
const CAGE_SQUARE = require('../assets/cage_square.png');
const CAGE_WIDE = require('../assets/cage_wide.png');

/** キャラを檻に閉じ込めた絵（背景画像 + キャラ + 檻の透過PNG）。ウィジェット(Swift)と揃えてある。 */
export function CageView({
  character,
  style,
  fixed = false,
  wide = false,
}: {
  character: Character;
  style?: ViewStyle;
  /** true なら正方形固定をやめ、style の width/height に従う（ウィジェットのプレビュー用） */
  fixed?: boolean;
  /** 横長の檻画像を使う（中サイズウィジェット） */
  wide?: boolean;
}) {
  return (
    <View style={[styles.room, fixed && { aspectRatio: undefined }, style]}>
      {/* 背景は下端基準。横長でも床が見えるようにする */}
      <View style={styles.bgBox}>
        <Image source={BG} style={styles.fill} resizeMode="cover" />
      </View>
      <Image source={character.image} style={styles.chara} resizeMode="contain" />
      <Image source={wide ? CAGE_WIDE : CAGE_SQUARE} style={[styles.fill, styles.cage]} resizeMode="stretch" />
    </View>
  );
}

const styles = StyleSheet.create({
  room: { width: '100%', aspectRatio: 1, overflow: 'hidden', borderRadius: 24, backgroundColor: '#1d1c2a' },
  fill: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  bgBox: { position: 'absolute', left: 0, bottom: 0, width: '100%', aspectRatio: 1 },
  // キャラ画像は足元が画像の下端に揃えてある。足元を床(背景の約91%の高さ)に置く
  chara: { position: 'absolute', bottom: '9%', left: '10%', width: '80%', height: '78%' },
  cage: { opacity: 0.85 },
});
