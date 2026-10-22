import { useState } from 'react';
import { findStyle } from './cageStyles';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/** 檻の中の画像の調整。x/y は檻の幅に対するずれの比率、scale は倍率。ウィジェット(Swift)も同じ意味で読む。 */
export type Adjust = { x: number; y: number; scale: number };
export const DEFAULT_ADJUST: Adjust = { x: 0, y: 0, scale: 1 };

/** 画像を檻に閉じ込めた絵（背景画像 + 画像 + 檻の透過PNG）。ウィジェット(Swift)と揃えてある。 */
export function CageView({
  imageUri,
  styleId,
  adjust = DEFAULT_ADJUST,
  style,
}: {
  imageUri: string | null;
  styleId?: string;
  adjust?: Adjust;
  style?: StyleProp<ViewStyle>;
}) {
  const [size, setSize] = useState(0);
  return (
    <View style={[styles.room, style]} onLayout={(e) => setSize(e.nativeEvent.layout.width)}>
      {/* 背景は下端基準 */}
      <View style={styles.bgBox}>
        <Image source={findStyle(styleId).bg} style={styles.fill} resizeMode="cover" />
      </View>
      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.chara,
            { transform: [{ translateX: adjust.x * size }, { translateY: adjust.y * size }, { scale: adjust.scale }] },
          ]}
          resizeMode="contain"
        />
      )}
      <Image source={findStyle(styleId).square} style={styles.fill} resizeMode="stretch" />
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
