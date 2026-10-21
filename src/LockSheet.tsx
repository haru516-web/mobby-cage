import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  PIN_LENGTH,
  authenticateDevice,
  biometricAvailable,
  clearPin,
  lockNow,
  setPin,
  unlockWithBiometrics,
  verifyPin,
} from './lockStore';

/** ロックまわりの操作の種類。then は、解除できたあとに続けてやる操作。 */
export type LockRequest =
  | { kind: 'setup' } // パスワードを設定する
  | { kind: 'unlock'; then?: () => void } // ロックを解除する
  | { kind: 'manage' }; // 解除中にロックの設定を変える

type Step = 'ask' | 'enter' | 'confirm' | 'unlock' | 'forgot' | 'forgotNone' | 'manage';

const FIRST_STEP: Record<LockRequest['kind'], Step> = { setup: 'ask', unlock: 'unlock', manage: 'manage' };

export function LockSheet({ request, onClose }: { request: LockRequest | null; onClose: () => void }) {
  const [step, setStep] = useState<Step>('ask');
  const [pin, setPinValue] = useState('');
  const [first, setFirst] = useState(''); // 設定時の1回目の入力
  const [message, setMessage] = useState<string | null>(null);
  const [bio, setBio] = useState(false);
  const busy = useRef(false);
  const [showAll, setShowAll] = useState(false); // 目のアイコンで、入力した数字をすべて表示
  const [flash, setFlash] = useState(false); // 押した直後だけ、最後の数字を表示
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 開くたびに最初の状態へ。解除のときは Face ID を自動で試す。
  useEffect(() => {
    if (!request) return;
    setStep(FIRST_STEP[request.kind]);
    setPinValue('');
    setFirst('');
    setMessage(null);
    setShowAll(false);
    setFlash(false);
    if (request.kind === 'unlock') {
      biometricAvailable().then((ok) => {
        setBio(ok);
        if (ok) tryBiometrics(request);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  if (!request) return <Modal visible={false} />;

  const finishUnlock = (req: LockRequest) => {
    onClose();
    if (req.kind === 'unlock') req.then?.();
  };

  const tryBiometrics = async (req: LockRequest) => {
    if (await unlockWithBiometrics()) finishUnlock(req);
  };

  const onDigits = async (value: string) => {
    if (busy.current) return;
    setPinValue(value);
    if (value.length > pin.length) {
      setFlash(true);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlash(false), 700);
    }
    if (value.length < PIN_LENGTH) return;
    busy.current = true;
    await new Promise((r) => setTimeout(r, 350)); // 最後の数字が見えるように、少し待ってから確認する
    try {
      if (step === 'enter') {
        setFirst(value);
        setStep('confirm');
        setMessage(null);
      } else if (step === 'confirm') {
        if (value === first) {
          await setPin(value);
          onClose();
        } else {
          setStep('enter');
          setFirst('');
          setMessage('パスワードが一致しませんでした。最初からやり直してください');
        }
      } else if (step === 'unlock') {
        const r = await verifyPin(value);
        if (r.ok) finishUnlock(request);
        else setMessage(r.waitSec ? `${r.waitSec}秒たってからもう一度` : 'パスワードが違います');
      }
    } finally {
      setPinValue('');
      busy.current = false;
    }
  };

  const forgot = async () => {
    setMessage(null);
    const r = await authenticateDevice();
    if (r === 'ok') {
      await clearPin();
      finishUnlock(request);
    } else if (r === 'none') {
      setStep('forgotNone');
    } else {
      setMessage('本人確認できませんでした');
    }
  };

  const pad = step === 'enter' || step === 'confirm' || step === 'unlock';
  const title =
    step === 'enter' ? 'パスワードを設定' : step === 'confirm' ? 'もう一度入力' : 'パスワードを入力';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.dim}>
        <View style={styles.card}>
          {step === 'ask' && (
            <>
              <Text style={styles.title}>パスワードを設定しますか？</Text>
              <Text style={styles.body}>
                設定すると、ウィジェットに表示する檻の切り替えと、檻の削除に、パスワード（数字{PIN_LENGTH}桁）が必要になります。
              </Text>
              <View style={styles.row}>
                <Btn label="いいえ" onPress={onClose} />
                <Btn label="はい" primary onPress={() => setStep('enter')} />
              </View>
            </>
          )}

          {pad && (
            <>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.body}>
                {step === 'enter' ? `数字${PIN_LENGTH}桁を入力` : step === 'confirm' ? '確認のため、同じパスワードを入力' : ' '}
              </Text>
              <View style={styles.dotsRow}>
                <View style={styles.eyeSpace} />
                <Dots value={pin} reveal={showAll} flash={flash} />
                <Pressable onPress={() => setShowAll((v) => !v)} hitSlop={10} style={styles.eyeSpace} accessibilityLabel={showAll ? '数字を隠す' : '数字を表示'}>
                  <Ionicons name={showAll ? 'eye-off-outline' : 'eye-outline'} size={22} color="#8d8a9f" />
                </Pressable>
              </View>
              <Text style={styles.message}>{message ?? ' '}</Text>
              <Keypad value={pin} onChange={onDigits} />
              {step === 'unlock' && (
                <View style={styles.links}>
                  {bio && (
                    <Pressable onPress={() => tryBiometrics(request)} hitSlop={8}>
                      <Text style={styles.link}>Face IDで解除</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={() => setStep('forgot')} hitSlop={8}>
                    <Text style={styles.link}>パスワードを忘れた</Text>
                  </Pressable>
                </View>
              )}
              <Pressable onPress={onClose} hitSlop={8} style={styles.cancel}>
                <Text style={styles.cancelText}>キャンセル</Text>
              </Pressable>
            </>
          )}

          {step === 'forgot' && (
            <>
              <Text style={styles.title}>パスワードを忘れた</Text>
              <Text style={styles.body}>
                本人確認（Face IDまたは端末のパスコード）のあと、設定していたパスワードを破棄します。ロックは解除されます。
              </Text>
              <Text style={styles.message}>{message ?? ' '}</Text>
              <View style={styles.row}>
                <Btn label="キャンセル" onPress={() => setStep('unlock')} />
                <Btn label="本人確認する" primary onPress={forgot} />
              </View>
            </>
          )}

          {step === 'forgotNone' && (
            <>
              <Text style={styles.title}>パスワードを破棄しますか？</Text>
              <Text style={styles.body}>
                この端末には、本人確認に使える認証（パスコードなど）がありません。破棄すると、ロックは解除されます。
              </Text>
              <View style={styles.row}>
                <Btn label="キャンセル" onPress={() => setStep('unlock')} />
                <Btn
                  label="破棄する"
                  primary
                  onPress={async () => {
                    await clearPin();
                    finishUnlock(request);
                  }}
                />
              </View>
            </>
          )}

          {step === 'manage' && (
            <>
              <Text style={styles.title}>ロックの設定</Text>
              <Text style={styles.body}>今はロックが解除されています。</Text>
              <View style={styles.stack}>
                <Btn
                  label="ロックする"
                  primary
                  onPress={() => {
                    lockNow();
                    onClose();
                  }}
                />
                <Btn
                  label="パスワードを削除"
                  onPress={async () => {
                    await clearPin();
                    onClose();
                  }}
                />
                <Btn label="キャンセル" onPress={onClose} />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Btn({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, primary && styles.btnPrimary]}>
      <Text style={[styles.btnText, primary && styles.btnTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

function Dots({ value, reveal, flash }: { value: string; reveal: boolean; flash: boolean }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: PIN_LENGTH }, (_, i) => {
        const filled = i < value.length;
        // 数字を見せるのは、「すべて表示」のときと、押した直後の最後の1桁だけ
        const show = filled && (reveal || (flash && i === value.length - 1));
        return (
          <View key={i} style={[styles.box, filled && styles.boxFilled]}>
            {filled && (show ? <Text style={styles.boxDigit}>{value[i]}</Text> : <View style={styles.boxDot} />)}
          </View>
        );
      })}
    </View>
  );
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

function Keypad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.keypad}>
      {KEYS.map((k, i) =>
        k === '' ? (
          <View key={i} style={styles.key} />
        ) : (
          <Pressable
            key={i}
            style={styles.key}
            onPress={() => {
              if (k === 'del') onChange(value.slice(0, -1));
              else if (value.length < PIN_LENGTH) onChange(value + k);
            }}
            accessibilityLabel={k === 'del' ? '削除' : k}
          >
            {({ pressed }) => (
              // 押している間は丸く光らせて、どのキーを押したか分かるようにする
              <View style={[styles.keyFace, pressed && styles.keyFacePressed]}>
                {k === 'del' ? (
                  <Ionicons name="backspace-outline" size={24} color="#fff" />
                ) : (
                  <Text style={styles.keyText}>{k}</Text>
                )}
              </View>
            )}
          </Pressable>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 340, backgroundColor: '#211f2b', borderRadius: 24, padding: 22 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  body: { color: '#c9c6d8', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  row: { flexDirection: 'row', gap: 10, marginTop: 20 },
  stack: { gap: 10, marginTop: 20 },
  btn: { flex: 1, borderRadius: 999, paddingVertical: 13, alignItems: 'center', backgroundColor: '#2c2a39' },
  btnPrimary: { backgroundColor: '#fff' },
  btnText: { color: '#e6e4f0', fontSize: 14, fontWeight: '700' },
  btnTextPrimary: { color: '#14131a', fontWeight: '800' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16 },
  eyeSpace: { width: 28, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  box: {
    width: 40,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#4a4859',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: { borderColor: '#fff', backgroundColor: '#2c2a39' },
  boxDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff' },
  boxDigit: { color: '#fff', fontSize: 24, fontWeight: '800' },
  message: { color: '#ff9aa8', fontSize: 12, textAlign: 'center', marginTop: 10, minHeight: 18 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  key: { width: '33.33%', height: 58, alignItems: 'center', justifyContent: 'center' },
  keyFace: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  keyFacePressed: { backgroundColor: 'rgba(255,255,255,0.22)' },
  keyText: { color: '#fff', fontSize: 24, fontWeight: '600' },
  links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4 },
  link: { color: '#9cc3ff', fontSize: 13, fontWeight: '600' },
  cancel: { alignSelf: 'center', marginTop: 14 },
  cancelText: { color: '#8d8a9f', fontSize: 13, fontWeight: '600' },
});
