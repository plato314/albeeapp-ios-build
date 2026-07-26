import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve('.');
const readText = path => readFile(join(root, path), 'utf8');
const pkg = JSON.parse(await readText('package.json'));
const config = JSON.parse(await readText('capacitor.config.json'));
const info = await readText('ios/App/App/Info.plist');
const privacy = await readText('ios/App/App/PrivacyInfo.xcprivacy');
const project = await readText('ios/App/App.xcodeproj/project.pbxproj');
const swiftPackage = await readText('ios/App/CapApp-SPM/Package.swift');
const iosPublic = await readText('ios/App/App/public/index.html');

function requireText(source, value, message) {
  if (!source.includes(value)) throw new Error(message);
}

if (pkg.dependencies['@capacitor/ios'] !== pkg.dependencies['@capacitor/core']) {
  throw new Error('@capacitor/ios and @capacitor/core versions must match');
}
if (!config.ios || config.ios.backgroundColor !== '#f9f6f2') {
  throw new Error('Capacitor iOS background color is missing');
}

for (const [key, description] of [
  ['NSCameraUsageDescription', 'camera'],
  ['NSPhotoLibraryUsageDescription', 'photo library'],
  ['NSPhotoLibraryAddUsageDescription', 'photo library additions']
]) {
  requireText(info, `<key>${key}</key>`, `Missing iOS ${description} permission description`);
}

requireText(
  privacy,
  'NSPrivacyAccessedAPICategoryFileTimestamp',
  'Filesystem privacy API category is missing'
);
requireText(privacy, '<string>C617.1</string>', 'Filesystem privacy reason C617.1 is missing');
requireText(
  project,
  'PrivacyInfo.xcprivacy in Resources',
  'Privacy manifest is not assigned to the iOS app target'
);
requireText(project, 'PRODUCT_BUNDLE_IDENTIFIER = tw.albee.purchaseledger;', 'Unexpected iOS bundle ID');
requireText(project, `MARKETING_VERSION = ${pkg.version};`, 'iOS marketing version is out of sync');
requireText(project, 'IPHONEOS_DEPLOYMENT_TARGET = 15.0;', 'Expected iOS 15 deployment target');
requireText(swiftPackage, 'CapacitorCamera', 'Camera plugin is missing from iOS Swift package');
requireText(swiftPackage, 'CapacitorFilesystem', 'Filesystem plugin is missing from iOS Swift package');
requireText(swiftPackage, 'CapacitorShare', 'Share plugin is missing from iOS Swift package');
if (/path: "[^"]*\\/.test(swiftPackage)) {
  throw new Error('Package.swift contains Windows path separators that Xcode cannot resolve');
}
requireText(
  iosPublic,
  `const APP_VERSION = '${pkg.version}'`,
  'Synced iOS web assets use the wrong app version'
);

function pngInfo(buffer, label) {
  const signature = '89504e470d0a1a0a';
  if (buffer.subarray(0, 8).toString('hex') !== signature) {
    throw new Error(`${label} is not a PNG`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType: buffer[25]
  };
}

const icon = pngInfo(
  await readFile(join(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')),
  'iOS app icon'
);
if (icon.width !== 1024 || icon.height !== 1024) {
  throw new Error(`iOS app icon must be 1024x1024, got ${icon.width}x${icon.height}`);
}
if (icon.colorType === 4 || icon.colorType === 6) {
  throw new Error('iOS app icon must not contain an alpha channel');
}

console.log(
  `iOS verification passed: Capacitor plugins, permissions, privacy manifest, bundle, v${pkg.version} and opaque 1024px icon`
);
