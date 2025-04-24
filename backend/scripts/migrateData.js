// Simple script to compile and run the TypeScript migration file
const { exec } = require('child_process');
const path = require('path');

console.log('Compiling and running migration script...');

// Compile the TypeScript file
exec('npx tsc src/scripts/migrateData.ts --outDir dist', { cwd: path.resolve(__dirname, '..') }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Compilation Error: ${error}`);
    return;
  }
  
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
  }
  
  console.log(`Compilation output: ${stdout}`);
  
  // Run the compiled JavaScript file
  exec('node dist/scripts/migrateData.js', { cwd: path.resolve(__dirname, '..') }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Execution Error: ${error}`);
      return;
    }
    
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
    }
    
    console.log(`Migration output:\n${stdout}`);
  });
}); 