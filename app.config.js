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
    plugins: ['@bacons/apple-targets'],
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
