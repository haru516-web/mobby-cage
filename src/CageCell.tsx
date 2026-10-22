import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CageView } from './CageView';
import type { Cage } from './cageStore';

/**
 * 一覧の1マス。編集モード中は iPhone のホーム画面のようにゆらゆら揺れて、右上に「×」が出る。
 */
export function CageCell({
  cage,
  active,
  editing,
  onPress,
  onLongPress,
  onDelete,
}: {
  cage: Cage;
  active: boolean;
  editing: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onDelete: () => void;
}) {
  const jiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!editing) {
      jiggle.stopAnimation();
      jiggle.setValue(0);
      return;
    }
    // マスごとに周期を少しずらして、揃って動かないようにする
    const half = 100 + (Number(cage.id.slice(-2)) % 5) * 14;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(jiggle, { toValue: 1, duration: half, useNativeDriver: true }),
        Animated.timing(jiggle, { toValue: -1, duration: half * 2, useNativeDriver: true }),
        Animated.timing(jiggle, { toValue: 0, duration: half, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [editing, jiggle, cage.id]);

  const rotate = jiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-1.8deg', '1.8deg'] });

  return (
    <Animated.View style={[styles.cell, { transform: [{ rotate }] }]}>
      <Pressable onPress={onPress} onLongPress={editing ? undefined : onLongPress}>
        <CageView imageUri={cage.uri} styleId={cage.styleId} adjust={cage.adjust} style={styles.cage} />
        {active && !editing && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ウィジェット</Text>
          </View>
        )}
      </Pressable>
      {editing && (
        <Pressable style={styles.delete} onPress={onDelete} hitSlop={8} accessibilityLabel="この檻を削除">
          <Ionicons name="close" size={18} color="#fff" />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
  delete: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(20,19,26,0.85)',
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
