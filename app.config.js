// Bundle ID / App Group はここ1か所で決まる。自分の Apple Developer のものに変える。
const BUNDLE_ID = 'com.example.orikko';
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
      supportsTablet: false,
      entitlements: {
        'com.apple.security.application-groups': [APP_GROUP],
      },
    },
    extra: { appGroup: APP_GROUP },
    web: { bundler: 'metro' },
  },
};
