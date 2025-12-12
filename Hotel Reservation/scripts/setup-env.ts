import { existsSync, copyFileSync, mkdirSync } from 'fs';
import { join } from 'path';

function ensureDir(p: string) {
  try { mkdirSync(p, { recursive: true }); } catch {}
}

function copyIfMissing(src: string, dest: string) {
  if (!existsSync(dest)) {
    copyFileSync(src, dest);
    console.log(`Created ${dest} from ${src}`);
  } else {
    console.log(`Exists: ${dest}`);
  }
}

const root = process.cwd();
const backendDir = join(root, 'backend');
const frontendDir = join(root, 'hotel-booking-frontend');

// Backend env
const beExample = join(backendDir, '.env.example');
const beLocal = join(backendDir, '.env.local');
if (existsSync(beExample)) {
  ensureDir(backendDir);
  copyIfMissing(beExample, beLocal);
}

// Frontend env
const feExample = join(frontendDir, '.env.example');
const feLocal = join(frontendDir, '.env.local');
if (existsSync(feExample)) {
  ensureDir(frontendDir);
  copyIfMissing(feExample, feLocal);
}

console.log('Environment setup complete. Review the .env.local files and update secrets as needed.');
