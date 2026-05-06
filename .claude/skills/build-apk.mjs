#!/usr/bin/env node
/**
 * Claude Code Skill: build-apk
 * Migrated from GitHub Copilot CLI extension.
 * Executes scripts/build-apk.sh to build and upload the APK.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const projectRoot = process.cwd();
const scriptPath = path.resolve(projectRoot, 'scripts/build-apk.sh');

if (!fs.existsSync(scriptPath)) {
    console.error(`❌ Build failed! Missing script: ${scriptPath}`);
    process.exit(1);
}

console.log('🔨 Building APK... (this takes ~2 minutes)');

const build = spawn('bash', [scriptPath], {
    cwd: projectRoot,
    stdio: 'inherit'
});

build.on('close', (code) => {
    if (code === 0) {
        console.log('✅ Build completed successfully!');
    } else {
        console.error(`❌ Build failed with exit code ${code}`);
        process.exit(code);
    }
});
