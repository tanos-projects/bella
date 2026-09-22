const { composePlugins, withNx } = require('@nx/webpack');

// Nx plugins for webpack.
// The @nx/webpack:webpack executor stopped deriving a webpack config from
// project.json options alone at Nx 22 - it now requires this file, which
// reuses the exact same options (main/tsConfig/assets/fileReplacements from
// project.json) via withNx().
module.exports = composePlugins(
  withNx({
    target: 'node',
  }),
  (config) => config
);
