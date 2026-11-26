import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function replaceOnce(file, marker, from, to) {
  const source = readFileSync(file, 'utf8');
  if (source.includes(marker)) return;
  const updated = source.replace(from, to);
  if (updated === source) throw new Error(`Unexpected Android source format in ${file}`);
  writeFileSync(file, updated);
}

export function installMealPlanSync(root) {
  const app = join(root, 'android/app');
  if (!existsSync(join(app, 'build.gradle'))) return;

  const java = join(app, 'src/main/java/com/healthmate/ai');
  const destination = join(java, 'sync');
  const sources = join(root, 'scripts/android-native/mealplan-sync');
  mkdirSync(destination, { recursive: true });
  for (const filename of readdirSync(sources)) {
    if (filename.endsWith('.java')) copyFileSync(join(sources, filename), join(destination, filename));
  }

  const schemaVersion = Number(/export const SCHEMA_VERSION = (\d+)/.exec(
    readFileSync(join(root, 'src/app/core/services/database/schema.ts'), 'utf8'),
  )?.[1]);
  if (!Number.isSafeInteger(schemaVersion) || schemaVersion < 1) throw new Error('Missing SQLite schema version');
  const tables = JSON.parse(readFileSync(join(root, 'server/pb_hooks/sync-schema.json'), 'utf8'));
  const schema = JSON.stringify({ schemaVersion, tables });
  const assets = join(app, 'src/main/assets');
  mkdirSync(assets, { recursive: true });
  writeFileSync(join(assets, 'mealplan-sync-schema.json'), schema);

  const tests = join(app, 'src/test/java/com/healthmate/ai/sync');
  const testResources = join(app, 'src/test/resources');
  mkdirSync(tests, { recursive: true });
  mkdirSync(testResources, { recursive: true });
  copyFileSync(join(root, 'scripts/android-native/SnapshotMergeTest.java'), join(tests, 'SnapshotMergeTest.java'));
  writeFileSync(join(testResources, 'mealplan-sync-schema.json'), schema);

  const activity = join(java, 'MainActivity.java');
  replaceOnce(activity, 'registerPlugin(MealPlanSyncPlugin.class)',
    /public class MainActivity extends BridgeActivity\s*\{/, `import android.os.Bundle;
import com.healthmate.ai.sync.MealPlanSyncPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MealPlanSyncPlugin.class);
        super.onCreate(savedInstanceState);
    }
`);

  const gradle = join(app, 'build.gradle');
  const pluginGradle = readFileSync(join(root, 'node_modules/@capacitor-community/sqlite/android/build.gradle'), 'utf8');
  const sqlCipher = /net\.zetetic:sqlcipher-android:[^'"\s]+/.exec(pluginGradle)?.[0];
  const sqlite = /androidx\.sqlite:sqlite:[^'"\s]+/.exec(pluginGradle)?.[0];
  if (!sqlCipher || !sqlite) throw new Error('Missing Capacitor SQLite library versions');
  for (const dependency of ['androidx.work:work-runtime:2.11.2', sqlCipher, sqlite]) {
    replaceOnce(gradle, dependency, /(^dependencies\s*\{)/m, `$1\n    implementation '${dependency}'`);
  }

  const jsonForTests = 'com.vaadin.external.google:android-json:0.0.20131108.vaadin1';
  replaceOnce(gradle, jsonForTests, /(^dependencies\s*\{)/m, `$1\n    testImplementation '${jsonForTests}'`);
}
