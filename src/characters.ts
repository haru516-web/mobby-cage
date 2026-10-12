import type { ImageSourcePropType } from 'react-native';

export type Character = {
  id: string; // ウィジェット側のアセット名と同じ
  name: string;
  catchphrase: string;
  accent: string;
  image: ImageSourcePropType;
};

// mobidou/src/petCatalog.ts と同じ並び・名前（らにモビーは除外）
export const CHARACTERS: readonly Character[] = [
  { id: 'mobirin', name: 'もびりん', catchphrase: '知的なおじ', accent: '#DCEAF0', image: require('../assets/characters/mobirin.png') },
  { id: 'mobichi', name: 'もびち', catchphrase: '気ままギャル♡', accent: '#FFE1EA', image: require('../assets/characters/mobichi.png') },
  { id: 'yami', name: '病みモビー', catchphrase: 'メンヘラちゃん', accent: '#E9E0F4', image: require('../assets/characters/yami.png') },
  { id: 'mobiyan', name: 'もびやん', catchphrase: 'まっすぐなヤンキー', accent: '#D8EFF4', image: require('../assets/characters/mobiyan.png') },
  { id: 'mobiyura', name: 'もびゆら', catchphrase: '痛いほど本気な堕天王', accent: '#E8D9FF', image: require('../assets/characters/mobiyura.png') },
  { id: 'reomoby', name: 'れおモビー', catchphrase: 'お姫様専属の王子様', accent: '#FFE3DC', image: require('../assets/characters/reomoby.png') },
  { id: 'potemoby', name: 'ぽてモビー', catchphrase: '休むことに全力なニート', accent: '#FFF0D9', image: require('../assets/characters/potemoby.png') },
  { id: 'mobibou', name: 'モビ坊', catchphrase: '調子のいい悪ガキ', accent: '#FFE6C5', image: require('../assets/characters/mobibou.png') },
  { id: 'babumoby', name: 'ばぶモビー', catchphrase: 'みんなを動かす赤ちゃん', accent: '#FFF0F3', image: require('../assets/characters/babumoby.png') },
  { id: 'bearmobby', name: 'くまモビー', catchphrase: 'ゆっくり寄り添うくま', accent: '#F2D1B1', image: require('../assets/characters/bearmobby.png') },
  { id: 'boymobby', name: 'ボーイモビー', catchphrase: '元気なキャップボーイ', accent: '#BFD7F5', image: require('../assets/characters/boymobby.png') },
  { id: 'dogmobby', name: 'いぬモビー', catchphrase: 'まっすぐなわんこ', accent: '#D9A66C', image: require('../assets/characters/dogmobby.png') },
  { id: 'ojimobby', name: 'おじモビー', catchphrase: '渋くて物知りなおじさん', accent: '#CBB79C', image: require('../assets/characters/ojimobby.png') },
  { id: 'reamobby', name: 'レアモビー', catchphrase: '森から来た気まぐれねこ', accent: '#C8A46E', image: require('../assets/characters/reamobby.png') },
  { id: 'shikamobby', name: 'しかモビー', catchphrase: '森を駆けるやさしいしか', accent: '#D6A36F', image: require('../assets/characters/shikamobby.png') },
  { id: 'uyumobby', name: 'うゆモビー', catchphrase: 'ふんわり甘えんぼ', accent: '#E7D7D3', image: require('../assets/characters/uyumobby.png') },
  { id: 'wolfmobby', name: 'ウルフモビー', catchphrase: '静かに燃えるオオカミ', accent: '#AEBBCB', image: require('../assets/characters/wolfmobby.png') },
];

export function findCharacter(id: string | null | undefined): Character {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
