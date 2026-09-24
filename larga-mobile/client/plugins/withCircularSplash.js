const { withAndroidStyles, withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs/promises');
const path = require('node:path');

// Compose native drawables without changing the brand artwork. Keep this before
// expo-splash-screen in app.json (mods run in reverse) so prebuild retains the circular launch badge.
module.exports = function withCircularSplash(config) {
  config = withAndroidStyles(config, (mod) => {
    const splash = mod.modResults.resources.style.find((style) => style.$.name === 'Theme.App.SplashScreen');
    if (!splash) throw new Error('expo-splash-screen must run before withCircularSplash');
    const icon = splash.item.find((item) => item.$.name === 'windowSplashScreenAnimatedIcon');
    if (icon) icon._ = '@drawable/larga_splash_badge';
    else splash.item.push({ $: { name: 'windowSplashScreenAnimatedIcon' }, _: '@drawable/larga_splash_badge' });
    return mod;
  });
  return withDangerousMod(config, ['android', async (mod) => {
    const root = mod.modRequest.projectRoot;
    const res = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res');
    await fs.mkdir(path.join(res, 'drawable-nodpi'), { recursive: true });
    await fs.mkdir(path.join(res, 'drawable'), { recursive: true });
    await fs.copyFile(path.join(root, 'assets/logo/logo-larga-short.png'), path.join(res, 'drawable-nodpi/larga_splash_mark.png'));
    await fs.copyFile(path.join(__dirname, 'splash/larga_splash_badge.xml'), path.join(res, 'drawable/larga_splash_badge.xml'));
    return mod;
  }]);
};
