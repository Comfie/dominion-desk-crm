import { runSeed } from './seed';

runSeed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
