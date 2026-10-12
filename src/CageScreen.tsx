import { useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Character } from './characters';
import { useCagePhysics } from './useCagePhysics';

const BG = require('../assets/bg.png');
const CAGE = require('../assets/cage_square.png');

/** 画面いっぱいの檻。傾け・振りでキャラが中で動く。 */
export function CageScreen({ character }: { character: Character }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const insets = useSafeAreaInsets();
  const size = Math.min(box.w * 0.55, box.h * 0.42);
  const { x, y, rot, sx, sy, poke } = useCagePhysics({ width: box.w, height: box.h, size });

  const bgSide = Math.max(box.w, box.h); // 背景は正方形。画面を覆うサイズで下端基準

  return (
    <Pressable
      style={styles.root}
      onPress={poke}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {box.w > 0 && (
        <>
          <View style={[styles.bg, { width: bgSide, height: bgSide, left: (box.w - bgSide) / 2 }]}>
            <Image source={BG} style={styles.fill} resizeMode="cover" />
          </View>

          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: size,
              height: size,
              transform: [
                { translateX: x },
                { translateY: y },
                { rotate: rot.interpolate({ inputRange: [-1, 1], outputRange: ['-18deg', '18deg'] }) },
                { scaleX: sx },
                { scaleY: sy },
              ],
            }}
          >
            <Image source={character.image} style={styles.fill} resizeMode="contain" />
          </Animated.View>

          <View style={styles.fill} pointerEvents="none">
            <Image source={CAGE} style={[styles.fill, styles.cage]} resizeMode="stretch" />
          </View>

          <View style={[styles.nameChip, { top: insets.top + 10 }]} pointerEvents="none">
            <Text style={styles.nameText}>{character.name}</Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1d1c2a', overflow: 'hidden' },
  bg: { position: 'absolute', bottom: 0 },
  fill: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  cage: { opacity: 0.85 },
  nameChip: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(20,19,26,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  nameText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
