import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const KEY = 'selectedCharacterID';

export async function loadSelectedId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** 選択を保存し、iOS ではウィジェットと共有して再描画を依頼する。 */
export async function saveSelectedId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, id);
  } catch {}

  if (Platform.OS !== 'ios') return;
  try {
    // ネイティブビルド（dev build / EAS）でのみ存在する。Expo Go では失敗するので握りつぶす。
    const { ExtensionStorage } = require('@bacons/apple-targets');
    const group = Constants.expoConfig?.extra?.appGroup as string;
    new ExtensionStorage(group).set(KEY, id);
    ExtensionStorage.reloadWidget();
  } catch {}
}
