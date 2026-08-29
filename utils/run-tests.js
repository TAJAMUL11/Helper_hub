const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const utilsDir = __dirname;
const files = fs.readdirSync(utilsDir);
const testFiles = files.filter(f => f.endsWith('.test.js'));

console.log(`Running ${testFiles.length} test suites in utils/...`);
let passedCount = 0;
let failedCount = 0;

for (const testFile of testFiles) {
  const fullPath = path.join(utilsDir, testFile);
  try {
    execSync(`node "${fullPath}"`, { stdio: 'inherit' });
    passedCount++;
  } catch (err) {
    console.error(`❌ Test failed: ${testFile}`);
    failedCount++;
  }
}

console.log(`\nTest Summary: ${passedCount} passed, ${failedCount} failed.`);
if (failedCount > 0) {
  process.exit(1);
}
