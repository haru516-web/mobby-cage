const fs = require('fs');
const path = require('path');

// assets/characters/*.png をそのままウィジェットの画像アセット(名前=キャラID)にする
const dir = path.join(__dirname, '../../assets/characters');
const images = Object.fromEntries(
  fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.png'))
    .map((f) => [path.basename(f, '.png'), `../../assets/characters/${f}`])
);
// 背景と檻（透過PNG）。Swift 側では Image("bg") / Image("cage_square") / Image("cage_wide")
images.bg = '../../assets/bg.png';
images.cage_square = '../../assets/cage_square.png';
images.cage_wide = '../../assets/cage_wide.png';

/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'OriCharaWidget',
  displayName: '檻キャラ',
  deploymentTarget: '17.0',
  frameworks: ['SwiftUI', 'WidgetKit'],
  colors: {
    $widgetBackground: '#14131a',
  },
  images,
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
