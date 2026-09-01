// Metro config for the npm-workspace monorepo layout: apps/mobile is a
// workspace package, but the word/UI/audio art it needs (assets/words,
// assets/v2, assets/audio at the repo root) lives one level above the
// workspace, alongside the still-untouched legacy web app. Standard Expo
// monorepo setup — watch the repo root so Metro can see and bundle those
// files, and resolve node_modules from both levels. Nothing under the repo
// root is moved, renamed or copied; this only widens what Metro is allowed
// to read.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..', '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
