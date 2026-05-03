import fs from 'fs';
import path from 'path';

function run(): void {
  const migrationsDir = path.resolve(__dirname, '../../migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .sort();

  if (files.length === 0) {
    throw new Error('No SQL migrations found.');
  }

  const versions = files.map((file) => parseInt(file.split('_')[0], 10));
  for (let i = 0; i < versions.length; i += 1) {
    const expected = i + 1;
    if (versions[i] !== expected) {
      throw new Error(
        `Migration numbering drift detected. Expected ${expected.toString().padStart(3, '0')}_*.sql but found ${files[i]}.`
      );
    }
  }

  console.log(`Migration numbering check passed (${files.length} files).`);
}

run();
