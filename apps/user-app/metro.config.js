const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// These packages must have exactly one copy across the entire bundle.
// The root node_modules has old versions (react@18, react-native@0.74) hoisted
// from admin-dashboard. Force every import — including subpaths like
// react/jsx-runtime — to resolve from this app's node_modules.
const SINGLETONS = new Set([
  'react', 'react-dom', 'react-native', 'react-native-web', 'scheduler',
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle both 'react' and 'react/jsx-runtime', 'react-native/Libraries/...' etc.
  const packageName = moduleName.split('/')[0];
  if (SINGLETONS.has(packageName)) {
    const pkgDir = path.resolve(projectRoot, 'node_modules', packageName);
    return context.resolveRequest(
      { ...context, originModulePath: path.join(pkgDir, 'index.js') },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.unstable_enablePackageExports = false;

module.exports = config;