
// 背景と檻（透過PNG）。ウィジェットはメモリ上限が小さいので、512pxに縮小した images/ を使う（元は assets/ の1024px）。Swift 側では Image("bg") / Image("cage_square") など
const images = {
  bg: './images/bg.png',
  cage_square: './images/cage_square.png',
  bg_cute_01: './images/bg_cute_01.png',
  bg_cute_02: './images/bg_cute_02.png',
  bg_sturdy_01: './images/bg_sturdy_01.png',
  bg_sturdy_02: './images/bg_sturdy_02.png',
  bg_ocean: './images/bg_ocean.png',
  cage_square_ocean: './images/cage_square_ocean.png',
  bg_cosmic: './images/bg_cosmic.png',
  cage_square_cosmic: './images/cage_square_cosmic.png',
  bg_japan: './images/bg_japan.png',
  cage_square_japan: './images/cage_square_japan.png',
  bg_palace: './images/bg_palace.png',
  cage_square_palace: './images/cage_square_palace.png',
  cage_square_cute_01: './images/cage_square_cute_01.png',
  cage_square_cute_02: './images/cage_square_cute_02.png',
  cage_square_sturdy_01: './images/cage_square_sturdy_01.png',
  cage_square_sturdy_02: './images/cage_square_sturdy_02.png',
};

/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'OrikkoWidget',
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
