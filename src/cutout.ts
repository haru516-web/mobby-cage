import { Platform } from 'react-native';

/**
 * 背景を透過した画像の URI を返す（iOS 17 以上の実機、端末内で処理。画像は外に送らない）。
 * 使えない環境（Web / Expo Go / シミュレータ / iOS 16 以下）では、理由つきのエラーを投げる。
 */
export async function removeBackground(uri: string): Promise<string> {
  if (Platform.OS !== 'ios') throw new Error('この環境では使えません（iPhoneの実機のみ）');
  try {
    // ネイティブビルド（dev build / EAS）でのみ存在する。Expo Go では失敗する。
    const { removeBackground: run } = require('@six33/react-native-bg-removal');
    return await run(uri, { trim: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'REQUIRES_API_FALLBACK') throw new Error('iOS 17 以上で使えます');
    throw new Error('背景を透過できませんでした');
  }
}
