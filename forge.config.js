const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: {
      unpack: '**/*.node',
    },
    extraResource: ['./addon/build/Release/wallpaper_addon.node'],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.node$/,
        use: 'native-ext-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.json', '.node'],
  },
  hooks: {
    // Copy your native module manually
    packageAfterCopy: async (
      forgeConfig,
      buildPath,
      electronVersion,
      platform,
      arch
    ) => {
      const fs = require('fs');
      const path = require('path');

      const addonSrc = path.resolve(__dirname, 'src/addon/build/swift_addon.node');
      const addonDest = path.join(buildPath, 'swift_addon.node');
      fs.copyFileSync(addonSrc, addonDest);
    },
  },
};
