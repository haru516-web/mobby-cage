
// 背景と檻（透過PNG）。Swift 側では Image("bg") / Image("cage_square") / Image("cage_wide")
const images = {
  bg: '../../assets/bg.png',
  cage_square: '../../assets/cage_square.png',
  cage_wide: '../../assets/cage_wide.png',
};

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
