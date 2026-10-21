import { Image, StyleSheet, View, type ViewStyle } from 'react-native';

const BG = require('../assets/bg.png');
const CAGE_SQUARE = require('../assets/cage_square.png');

/** 画像を檻に閉じ込めた絵（背景画像 + 画像 + 檻の透過PNG）。ウィジェット(Swift)と揃えてある。 */
export function CageView({ imageUri, style }: { imageUri: string | null; style?: ViewStyle }) {
  return (
    <View style={[styles.room, style]}>
      {/* 背景は下端基準 */}
      <View style={styles.bgBox}>
        <Image source={BG} style={styles.fill} resizeMode="cover" />
      </View>
      {imageUri && <Image source={{ uri: imageUri }} style={styles.chara} resizeMode="contain" />}
      <Image source={CAGE_SQUARE} style={styles.fill} resizeMode="stretch" />
    </View>
  );
}

const styles = StyleSheet.create({
  room: { width: '100%', aspectRatio: 1, overflow: 'hidden', borderRadius: 24, backgroundColor: '#1d1c2a' },
  fill: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  bgBox: { position: 'absolute', left: 0, bottom: 0, width: '100%', aspectRatio: 1 },
  // 画像の下端を床(背景の約91%の高さ)に置く
  chara: { position: 'absolute', bottom: '9%', left: '10%', width: '80%', height: '78%' },
});
