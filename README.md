# 檻キャラ (ori-chara-ios)

アプリでキャラを選ぶと、ホーム画面ウィジェットでそのキャラが檻に閉じ込められた表示になる。
Expo (SDK 54) + `@bacons/apple-targets`（iOS ウィジェット）。Windows だけで開発・ビルドできる。

## 画面確認（Web）
```
npm install
npm run web      # http://localhost:8081
```
Web ではアプリ UI だけ確認できる（ウィジェットは iOS 実機のみ）。

## 実機（iOS）
ウィジェットはネイティブ拡張なので Expo Go では動かない。EAS Build で作る。

1. `app.config.js` の `BUNDLE_ID` を自分の Apple Developer のものにする
   （App Group は `group.<BUNDLE_ID>` に自動で揃う）
2. `app.config.js` の `expo.ios` に `appleTeamId: 'XXXXXXXXXX'` を足す（警告が消える）
3. `npm i -g eas-cli` → `eas login` → `eas build:configure`
4. 開発用: `eas build -p ios --profile development`（Apple Developer Program が必要）
5. 公開: `eas build -p ios --profile production` → `eas submit -p ios`

## 構成
- `App.tsx` … 画面（プレビュー / 入居ボタン / キャラ一覧 / 使い方）
- `src/characters.ts` … キャラ定義（mobidou の petCatalog と同じ並び・名前。らにモビーは除外）
- `src/CageView.tsx` … 檻の描画（アプリ用）
- `src/selection.ts` … 選択の保存。iOS では App Group に書いてウィジェットを再読込
- `targets/widget/` … ウィジェット本体（SwiftUI）。`index.swift` に檻の描画が重複してある
- `assets/characters/` … キャラ画像（512px PNG）。ウィジェットのアセットにも自動で取り込まれる
