// Bundle ID / App Group はここ1か所で決まる（App Group は group.<Bundle ID>）。
const BUNDLE_ID = 'com.orikko.app';
const APP_GROUP = `group.${BUNDLE_ID}`;

module.exports = {
  expo: {
    name: 'おりっこ',
    slug: 'orikko',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    backgroundColor: '#14131a',
    plugins: [
      '@bacons/apple-targets',
      // ロックの解除に Face ID を使う（文言は審査でも見られる）
      ['expo-local-authentication', { faceIDPermission: 'ロックの解除にFace IDを使います。' }],
      'expo-secure-store',
      [
        'expo-image-picker',
        {
          photosPermission: '檻に入れる画像を、写真アプリから選ぶために使います。',
          // カメラとマイクは使わない（権限の文言も入れない）
          cameraPermission: false,
          microphonePermission: false,
        },
      ],
    ],
    ios: {
      bundleIdentifier: BUNDLE_ID,
      appleTeamId: '473V9BLJ33',
      supportsTablet: false,
      entitlements: {
        'com.apple.security.application-groups': [APP_GROUP],
      },
    },
    extra: { appGroup: APP_GROUP },
    web: { bundler: 'metro' },
  },
};
