import type { ImageSourcePropType } from 'react-native';

export type CageStyle = {
  id: string;
  name: string;
  square: ImageSourcePropType;
  bg: ImageSourcePropType;
};

export const DEFAULT_STYLE_ID = 'standard';

// 使える檻の一覧。id はウィジェット側の画像名と対応する（standard は cage_square / bg、他は cage_square_<id> / bg_<id>）。
export const CAGE_STYLES: readonly CageStyle[] = [
  { id: 'standard', name: 'シルバー', square: require('../assets/cage_square.png'), bg: require('../assets/bg.png') },
  { id: 'cute_01', name: 'ハート', square: require('../assets/cage_square_cute_01.png'), bg: require('../assets/bg_cute_01.png') },
  { id: 'cute_02', name: 'かわいい2', square: require('../assets/cage_square_cute_02.png'), bg: require('../assets/bg_cute_02.png') },
  { id: 'sturdy_01', name: 'ヘビーメタル', square: require('../assets/cage_square_sturdy_01.png'), bg: require('../assets/bg_sturdy_01.png') },
  { id: 'sturdy_02', name: 'ヘビーメタル2', square: require('../assets/cage_square_sturdy_02.png'), bg: require('../assets/bg_sturdy_02.png') },
  { id: 'ocean', name: 'オーシャン', square: require('../assets/cage_square_ocean.png'), bg: require('../assets/bg_ocean.png') },
  { id: 'cosmic', name: 'コスミック', square: require('../assets/cage_square_cosmic.png'), bg: require('../assets/bg_cosmic.png') },
  { id: 'japan', name: '和風', square: require('../assets/cage_square_japan.png'), bg: require('../assets/bg_japan.png') },
  { id: 'palace', name: 'パレス', square: require('../assets/cage_square_palace.png'), bg: require('../assets/bg_palace.png') },
];

export function findStyle(id: string | null | undefined): CageStyle {
  return CAGE_STYLES.find((s) => s.id === id) ?? CAGE_STYLES[0];
}
