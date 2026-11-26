import { readFileSync, writeFileSync } from 'node:fs';

if ((process.env.CAPACITOR_PLATFORM_NAME ?? 'android') === 'android') {
  const handler = new URL(
    '../node_modules/@capacitor/android/capacitor/src/main/java/com/getcapacitor/MessageHandler.java',
    import.meta.url,
  );
  const source = readFileSync(handler, 'utf8');
  const dispatch = '                    postMessage(message.getData());';
  const updateReplyProxy = '                    javaScriptReplyProxy = replyProxy;';
  const before = dispatch + '\n' + updateReplyProxy;
  const after = updateReplyProxy + '\n' + dispatch;

  // A plugin can answer the previous document if dispatch wins the race (Capacitor #8616).
  if (source.includes(before)) {
    writeFileSync(handler, source.replace(before, after));
    console.log('[android-bridge] Set the reply proxy before plugin dispatch.');
  } else if (!source.includes(after)) {
    throw new Error(
      'Unexpected Capacitor Android message handler. Recheck the fix for issue #8616.',
    );
  }
}
