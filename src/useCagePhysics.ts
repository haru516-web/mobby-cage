import { useCallback, useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';

type Params = {
  width: number; // 檻エリアの幅
  height: number; // 檻エリアの高さ
  size: number; // キャラの一辺
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
/** 目標値へなめらかに近づける（dt に依存しない指数補間） */
const ease = (cur: number, target: number, rate: number, dt: number) =>
  cur + (target - cur) * (1 - Math.exp(-rate * dt));

/**
 * 檻の中でキャラを動かす簡易物理。やわらかく、ふわっと動く調整。
 *  - 端末の傾き  → ゆっくり傾いた側へ滑る
 *  - 振る        → 慣性で取り残されて壁に当たり、ぽよんと跳ね返る / 強いとジャンプ
 *  - 伸び縮み    → 動く向きに伸び、ぶつかるとぷにっと潰れ、止まっていても呼吸する
 *  - Web         → マウスの横位置で傾き、クリックで「ポン」と跳ねる（動作確認用）
 */
export function useCagePhysics({ width, height, size }: Params) {
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current; // -1 .. 1
  const sx = useRef(new Animated.Value(1)).current; // 伸び縮み(横)
  const sy = useRef(new Animated.Value(1)).current; // 伸び縮み(縦)

  const s = useRef({
    px: 0, py: 0, vx: 0, vy: 0,
    // 潰れのバネ（正で潰れる）。床/天井への衝突=縦、壁への衝突=横
    dY: 0, dYv: 0, dX: 0, dXv: 0,
    stX: 0, stY: 0, // 速さによる伸び（なめらかに追従）
    rotS: 0, // 回転（なめらかに追従）
    gx: 0, // 傾き(重力)の横成分の目標 [-1..1]
    gxS: 0, // 実際に効かせる値（なめらかに追従）
    gLP: { x: 0, y: 0, z: 0 }, // 重力のローパス
    lastHaptic: 0,
  }).current;

  const poke = useCallback(() => {
    s.dYv += 3; // 踏み込みで少し縮んでから跳ぶ
    s.vy -= height * 1.15;
    s.vx += (Math.random() - 0.5) * width * 1.6;
  }, [s, height, width]);

  // センサー入力
  useEffect(() => {
    if (Platform.OS === 'web') {
      const onMove = (e: MouseEvent) => {
        s.gx = clamp(((e.clientX / window.innerWidth) - 0.5) * 2.4, -1, 1);
      };
      window.addEventListener('mousemove', onMove);
      return () => window.removeEventListener('mousemove', onMove);
    }

    let sub: { remove: () => void } | null = null;
    Accelerometer.isAvailableAsync()
      .then((ok) => {
        if (!ok) return;
        Accelerometer.setUpdateInterval(16);
        sub = Accelerometer.addListener(({ x: ax, y: ay, z: az }) => {
          // 重力成分 = ローパス、残りが「振った」成分
          const g = s.gLP;
          g.x += (ax - g.x) * 0.08;
          g.y += (ay - g.y) * 0.08;
          g.z += (az - g.z) * 0.08;
          s.gx = clamp(g.x * 1.5, -1, 1);

          const lx = ax - g.x;
          const ly = ay - g.y;
          const lz = az - g.z;
          const mag = Math.sqrt(lx * lx + ly * ly + lz * lz);
          if (mag > 0.18) {
            // 端末が動いた向きと逆に、中身は慣性で取り残される（1回の入力は上限つき）
            s.vx -= clamp(lx * width * 1.7, -width * 1.2, width * 1.2);
            s.vy += clamp(ly * width * 1.7, -height * 0.8, height * 0.8);
            if (mag > 1.2) s.vy -= Math.min(mag, 3) * height * 0.35; // 強く振ったら跳ねる
          }
        });
      })
      .catch(() => {});
    return () => sub?.remove();
  }, [s, width, height]);

  // 物理ループ
  useEffect(() => {
    if (width <= 0 || height <= 0 || size <= 0) return;

    const minX = width * 0.07;
    const maxX = width * 0.93 - size;
    const minY = height * 0.05;
    const maxY = height * 0.9 - size; // 足元が床(背景の約90%)に乗る
    const G = height * 1.9; // 重力 [px/s^2]（少しふわっと）
    const maxV = Math.max(width, height) * 3;

    s.px = clamp(s.px || (minX + maxX) / 2, minX, maxX);
    s.py = clamp(s.py || maxY, minY, maxY);

    let raf = 0;
    let last = Date.now();

    const impact = (v: number) => {
      if (Platform.OS === 'web') return;
      const now = Date.now();
      if (v > width * 0.9 && now - s.lastHaptic > 140) {
        s.lastHaptic = now;
        Haptics.impactAsync(
          v > width * 2.2 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
        ).catch(() => {});
      }
    };

    const tick = () => {
      const now = Date.now();
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      // 傾きはなめらかに効かせる（急に滑り出さない）
      s.gxS = ease(s.gxS, s.gx, 6, dt);

      // 力
      s.vx += s.gxS * G * 0.6 * dt;
      s.vy += G * dt;

      // 減衰（床の上では摩擦が強い）
      const onFloor = s.py >= maxY - 0.5;
      s.vx *= 1 - (onFloor ? 2.4 : 0.6) * dt;
      s.vy *= 1 - 0.25 * dt;

      s.vx = clamp(s.vx, -maxV, maxV);
      s.vy = clamp(s.vy, -maxV, maxV);

      s.px += s.vx * dt;
      s.py += s.vy * dt;

      // 壁・床・天井でやわらかく跳ね返る。ぶつかった強さに応じて潰れる
      // 床に載っているだけの微小な衝突では潰さない（しきい値）
      const squashX = (v: number) => { if (v > width * 0.15) s.dXv += Math.min(10, (v / width) * 7); };
      const squashY = (v: number) => { if (v > height * 0.15) s.dYv += Math.min(10, (v / height) * 7); };
      if (s.px < minX) { s.px = minX; impact(Math.abs(s.vx)); squashX(Math.abs(s.vx)); s.vx = -s.vx * 0.4; }
      if (s.px > maxX) { s.px = maxX; impact(Math.abs(s.vx)); squashX(Math.abs(s.vx)); s.vx = -s.vx * 0.4; }
      if (s.py > maxY) {
        s.py = maxY;
        impact(Math.abs(s.vy));
        squashY(Math.abs(s.vy));
        s.vy = Math.abs(s.vy) < height * 0.18 ? 0 : -s.vy * 0.3;
      }
      if (s.py < minY) { s.py = minY; impact(Math.abs(s.vy)); squashY(Math.abs(s.vy)); s.vy = -s.vy * 0.35; }

      // 潰れのバネ（ゆっくり、ぷるんと戻る。少しだけ揺れが残る）
      s.dYv += (-90 * s.dY - 8.5 * s.dYv) * dt;
      s.dXv += (-90 * s.dX - 8.5 * s.dXv) * dt;
      s.dY = clamp(s.dY + s.dYv * dt, -0.5, 1);
      s.dX = clamp(s.dX + s.dXv * dt, -0.5, 1);

      // 速さに応じて動く方向に伸びる（目標へなめらかに追従）。潰れている間は伸びを抑える
      const squashing = clamp(1 - 2.5 * Math.max(s.dY, s.dX), 0.15, 1);
      s.stY = ease(s.stY, Math.min(0.2, Math.abs(s.vy) / (height * 4.5)) * squashing, 10, dt);
      s.stX = ease(s.stX, Math.min(0.14, Math.abs(s.vx) / (width * 5)) * squashing, 10, dt);

      const breath = 0.02 * Math.sin(now / 700); // ゆっくりした呼吸
      const v = (1 + s.stY - 0.4 * s.dY) * (1 + breath);
      const h = 1 + s.stX - 0.35 * s.dX;
      // 体積がほぼ一定になるよう、縦が伸びたら横を細く（逆も）
      const scaleY = clamp(v * Math.pow(1 / h, 0.5), 0.7, 1.35);
      const scaleX = clamp(h * Math.pow(1 / v, 0.5), 0.7, 1.35);

      // 拡縮は中心基準。足元が床から、横が壁から離れないよう位置を補正
      let offX = 0;
      if (s.px <= minX + 1) offX = ((scaleX - 1) * size) / 2;
      else if (s.px >= maxX - 1) offX = ((1 - scaleX) * size) / 2;
      x.setValue(s.px + offX);
      y.setValue(s.py - ((scaleY - 1) * size) / 2);
      sx.setValue(scaleX);
      sy.setValue(scaleY);

      // 傾きは進行方向に、ゆるやかに追従
      const rotTarget = clamp(s.vx / (width * 2.2) + s.gxS * 0.2, -1, 1);
      s.rotS = ease(s.rotS, rotTarget, 7, dt);
      rot.setValue(s.rotS);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [width, height, size, s, x, y, rot, sx, sy]);

  return { x, y, rot, sx, sy, poke };
}
