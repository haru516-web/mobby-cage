# おりっこ (orikko)

アプリで好きな画像をアップすると、ホーム画面ウィジェットでその画像が檻に閉じ込められた表示になる。
Expo (SDK 54) + `@bacons/apple-targets`（iOS ウィジェット）。Windows だけで開発・ビルドできる。

## 画面確認（Web）
```
npm install
npm run web      # http://localhost:8081
```
Web ではアプリ UI だけ確認できる（画像は localStorage に保存）（ウィジェットは iOS 実機のみ）。

## 実機（iOS）
ウィジェットはネイティブ拡張なので Expo Go では動かない。EAS Build で作る。

1. `app.config.js` の `BUNDLE_ID` を自分の Apple Developer のものにする
   （App Group は `group.<BUNDLE_ID>` に自動で揃う）
2. `app.config.js` の `expo.ios` に `appleTeamId: 'XXXXXXXXXX'` を足す（警告が消える）
3. `npm i -g eas-cli` → `eas login` → `eas build:configure`
4. 開発用: `eas build -p ios --profile development`（Apple Developer Program が必要）
5. 公開: `eas build -p ios --profile production` → `eas submit -p ios`

## 構成
- `App.tsx` … ナビバー（マイ檻 / 使える檻）
- `src/MyCagesScreen.tsx` … 作った檻の一覧（横2列）と＋ボタンでの作成
- `src/CageStylesScreen.tsx` / `src/cageStyles.ts` … 使える檻（デザイン）の一覧
- `src/CageView.tsx` … 檻の描画（`assets/bg.png` + 画像 + `assets/cage_square.png`）
- `src/cageStore.ts` … 檻の保存（600px PNG）。iOS では App Group に `cage_<id>.png`、ウィジェット用に `cage_image.png` へコピーして再読込
- `targets/widget/` … ウィジェット本体（SwiftUI）。`index.swift` が `cage_image.png` を読み、背景(`bg*.png`)と檻(`cage_square*.png`)を重ねる。小・大サイズのみ対応（中サイズは無し）
