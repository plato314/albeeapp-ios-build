import { Capacitor } from '@capacitor/core';
import { Camera, MediaTypeSelection } from '@capacitor/camera';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const CANCEL_CODES = new Set(['OS-PLUG-CAMR-0006', 'OS-PLUG-CAMR-0020']);

function isNative() {
  return Capacitor.isNativePlatform();
}

function isCancelled(error) {
  if (CANCEL_CODES.has(error && error.code)) return true;
  return /cancel/i.test(String(error && error.message ? error.message : ''));
}

async function mediaToDataUrl(result) {
  if (!result) return null;
  const format = String(result.metadata && result.metadata.format || 'jpeg').toLowerCase();
  if (result.uri) {
    const file = await Filesystem.readFile({ path: result.uri });
    if (typeof file.data !== 'string') throw new Error('無法讀取照片內容');
    return `data:image/${format};base64,${file.data}`;
  }
  if (result.thumbnail) return `data:image/${format};base64,${result.thumbnail}`;
  throw new Error('相機沒有回傳照片');
}

async function chooseImage(source) {
  if (!isNative()) return null;
  try {
    if (source === 'camera') {
      return await mediaToDataUrl(await Camera.takePhoto({
        quality: 85,
        targetWidth: 1280,
        targetHeight: 1280,
        correctOrientation: true,
        saveToGallery: false,
        includeMetadata: true
      }));
    }
    const picked = await Camera.chooseFromGallery({
      quality: 85,
      targetWidth: 1280,
      targetHeight: 1280,
      mediaType: MediaTypeSelection.Photo,
      allowMultipleSelection: false,
      limit: 1,
      includeMetadata: true
    });
    return picked.results && picked.results[0]
      ? await mediaToDataUrl(picked.results[0])
      : null;
  } catch (error) {
    if (isCancelled(error)) return null;
    throw error;
  }
}

async function shareTextFile(filename, text) {
  const saved = await Filesystem.writeFile({
    path: filename,
    data: text,
    directory: Directory.Cache,
    encoding: Encoding.UTF8
  });
  await Share.share({
    title: filename,
    files: [saved.uri],
    dialogTitle: '儲存或分享檔案'
  });
  return saved.uri;
}

async function shareBase64File(filename, base64Data) {
  const saved = await Filesystem.writeFile({
    path: filename,
    data: base64Data,
    directory: Directory.Cache
  });
  await Share.share({
    title: filename,
    files: [saved.uri],
    dialogTitle: '儲存或分享檔案'
  });
  return saved.uri;
}

window.NativeBridge = {
  isNative,
  chooseImage,
  shareTextFile,
  shareBase64File
};
