import { useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

/**
 * ウィジェットの変更を止める、アプリ内のロック（数字4桁のパスワード1つ）。
 * パスワードは端末の Keychain にだけ置く（サーバーには何も送らない）。保存するのは、そのままではなく、ソルト付きのハッシュ。
 * Web には Keychain が無いので、画面確認用に通常の保存先で代用する（実機ではない）。
 */

const KEY = 'lockPin';
export const PIN_LENGTH = 4;
const MAX_FAILS = 5;
const WAIT_MS = 30_000;

type State = { ready: boolean; hasPin: boolean; unlocked: boolean };

let state: State = { ready: false, hasPin: false, unlocked: false };
const listeners = new Set<() => void>();

function update(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function useLock(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state
  );
}

const native = Platform.OS !== 'web';

async function readStored(): Promise<{ salt: string; hash: string } | null> {
  try {
    const raw = native ? await SecureStore.getItemAsync(KEY) : await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function writeStored(v: { salt: string; hash: string }) {
  const raw = JSON.stringify(v);
  if (native) {
    await SecureStore.setItemAsync(KEY, raw, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  } else {
    await AsyncStorage.setItem(KEY, raw);
  }
}

async function removeStored() {
  try {
    if (native) await SecureStore.deleteItemAsync(KEY);
    else await AsyncStorage.removeItem(KEY);
  } catch {}
}

const digest = (salt: string, pin: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);

// 起動時に、パスワードが設定済みかを読む（解除状態は毎回ロックから始める）
readStored().then((v) => update({ ready: true, hasPin: !!v, unlocked: false }));

// アプリを閉じたら（バックグラウンドに回ったら）すぐロックに戻す。Face ID の確認中は 'inactive' なので無視する。
AppState.addEventListener('change', (s) => {
  if (s === 'background') update({ unlocked: false });
});

export async function setPin(pin: string): Promise<void> {
  const salt = Crypto.randomUUID();
  await writeStored({ salt, hash: await digest(salt, pin) });
  update({ hasPin: true, unlocked: false }); // 設定した直後はロック中にする
}

export async function clearPin(): Promise<void> {
  await removeStored();
  update({ hasPin: false, unlocked: false });
}

export function lockNow() {
  update({ unlocked: false });
}

let fails = 0;
let waitUntil = 0;

/** パスワードを照合する。連続で間違えると 30 秒待たせる。 */
export async function verifyPin(pin: string): Promise<{ ok: boolean; waitSec?: number }> {
  const now = Date.now();
  if (now < waitUntil) return { ok: false, waitSec: Math.ceil((waitUntil - now) / 1000) };
  const stored = await readStored();
  if (stored && (await digest(stored.salt, pin)) === stored.hash) {
    fails = 0;
    update({ unlocked: true });
    return { ok: true };
  }
  fails += 1;
  if (fails >= MAX_FAILS) {
    fails = 0;
    waitUntil = Date.now() + WAIT_MS;
    return { ok: false, waitSec: WAIT_MS / 1000 };
  }
  return { ok: false };
}

/** Face ID / Touch ID が使えるか。 */
export async function biometricAvailable(): Promise<boolean> {
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

/** Face ID で解除する。端末のパスコードへの切り替えはさせない（アプリのパスワードの代わりにならないように）。 */
export async function unlockWithBiometrics(): Promise<boolean> {
  try {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: 'ロックを解除',
      cancelLabel: 'キャンセル',
      disableDeviceFallback: true,
    });
    if (r.success) update({ unlocked: true });
    return r.success;
  } catch {
    return false;
  }
}

/**
 * 「パスワードを忘れた」用の本人確認。Face ID か端末のパスコード。
 * 'none' は、この端末に認証（パスコードなど）が無くて確認できない場合。
 */
export async function authenticateDevice(): Promise<'ok' | 'failed' | 'none'> {
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    if (level === LocalAuthentication.SecurityLevel.NONE) return 'none';
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: '本人確認',
      cancelLabel: 'キャンセル',
    });
    return r.success ? 'ok' : 'failed';
  } catch {
    return 'none';
  }
}
