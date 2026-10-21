import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as ImageManipulator from 'expo-image-manipulator';
import { Directory, File, Paths } from 'expo-file-system';

export type Cage = {
  id: string;
  uri: string;
  createdAt: number;
};

const LIST_KEY = 'cages';
const WIDGET_KEY = 'widgetCageId';
const WIDGET_FILE = 'cage_image.png'; // ウィジェット(Swift)が読むファイル名
const MAX_SIDE = 600; // ウィジェットのメモリ上限に収めるため縮小して保存する

// iOS は画像をファイルで持つ。Web は data URI をそのまま持つ。
type Stored = { id: string; createdAt: number; dataUri?: string };

const isIOS = Platform.OS === 'ios';

function sharedDir(): Directory | null {
  if (!isIOS) return null;
  const group = Constants.expoConfig?.extra?.appGroup as string;
  return Paths.appleSharedContainers?.[group] ?? null;
}

async function readStored(): Promise<Stored[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(LIST_KEY)) ?? '[]');
  } catch {
    return [];
  }
}

async function writeStored(list: Stored[]) {
  try {
    await AsyncStorage.setItem(LIST_KEY, JSON.stringify(list));
  } catch {}
}

function uriOf(s: Stored): string {
  const dir = sharedDir();
  return dir ? new File(dir, `cage_${s.id}.png`).uri : (s.dataUri ?? '');
}

export async function loadCages(): Promise<Cage[]> {
  const list = await readStored();
  return list
    .map((s) => ({ id: s.id, createdAt: s.createdAt, uri: uriOf(s) }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function loadWidgetCageId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(WIDGET_KEY);
  } catch {
    return null;
  }
}

function reloadWidget() {
  try {
    // ネイティブビルド（dev build / EAS）でのみ存在する。Expo Go では失敗するので握りつぶす。
    require('@bacons/apple-targets').ExtensionStorage.reloadWidget();
  } catch {}
}

/** ウィジェットに表示する檻を切り替える。 */
export async function setWidgetCage(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(WIDGET_KEY, id);
  } catch {}
  const dir = sharedDir();
  if (!dir) return;
  try {
    const dest = new File(dir, WIDGET_FILE);
    if (dest.exists) dest.delete();
    new File(dir, `cage_${id}.png`).copy(dest);
  } catch {}
  reloadWidget();
}

/** 選んだ画像を縮小して新しい檻として保存する。最初の1つは自動でウィジェットに設定。 */
export async function createCage(sourceUri: string): Promise<void> {
  const result = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: MAX_SIDE } }],
    { format: ImageManipulator.SaveFormat.PNG, base64: !isIOS }
  );
  const stored: Stored = { id: String(Date.now()), createdAt: Date.now() };
  const dir = sharedDir();
  if (dir) {
    new File(result.uri).copy(new File(dir, `cage_${stored.id}.png`));
  } else {
    stored.dataUri = `data:image/png;base64,${result.base64 ?? ''}`;
  }

  await writeStored([...(await readStored()), stored]);
  if (!(await loadWidgetCageId())) await setWidgetCage(stored.id);
}

export async function deleteCage(id: string): Promise<void> {
  await writeStored((await readStored()).filter((s) => s.id !== id));
  const dir = sharedDir();
  try {
    const f = dir && new File(dir, `cage_${id}.png`);
    if (f && f.exists) f.delete();
  } catch {}

  if ((await loadWidgetCageId()) !== id) return;
  try {
    await AsyncStorage.removeItem(WIDGET_KEY);
  } catch {}
  const rest = await loadCages();
  if (rest.length) {
    await setWidgetCage(rest[0].id);
    return;
  }
  try {
    const w = dir && new File(dir, WIDGET_FILE);
    if (w && w.exists) w.delete();
  } catch {}
  reloadWidget();
}
