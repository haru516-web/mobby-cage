
// 背景と檻（透過PNG）。Swift 側では Image("bg") / Image("cage_square") など
const images = {
  bg: '../../assets/bg.png',
  cage_square: '../../assets/cage_square.png',
  bg_cute_01: '../../assets/bg_cute_01.png',
  bg_cute_02: '../../assets/bg_cute_02.png',
  bg_sturdy_01: '../../assets/bg_sturdy_01.png',
  bg_sturdy_02: '../../assets/bg_sturdy_02.png',
  bg_ocean: '../../assets/bg_ocean.png',
  cage_square_ocean: '../../assets/cage_square_ocean.png',
  bg_cosmic: '../../assets/bg_cosmic.png',
  cage_square_cosmic: '../../assets/cage_square_cosmic.png',
  bg_japan: '../../assets/bg_japan.png',
  cage_square_japan: '../../assets/cage_square_japan.png',
  bg_palace: '../../assets/bg_palace.png',
  cage_square_palace: '../../assets/cage_square_palace.png',
  cage_square_cute_01: '../../assets/cage_square_cute_01.png',
  cage_square_cute_02: '../../assets/cage_square_cute_02.png',
  cage_square_sturdy_01: '../../assets/cage_square_sturdy_01.png',
  cage_square_sturdy_02: '../../assets/cage_square_sturdy_02.png',
};

/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'OriCharaWidget',
  displayName: 'おりっこ',
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
