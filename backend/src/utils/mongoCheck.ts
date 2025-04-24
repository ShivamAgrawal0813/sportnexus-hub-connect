import { exec } from 'child_process';
import { platform } from 'os';

/**
 * Checks if MongoDB is running locally
 * @returns Promise<boolean> - true if MongoDB is running, false otherwise
 */
export const isMongoDBRunning = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Command to check MongoDB status based on OS
    const cmd = platform() === 'win32' 
      ? 'netstat -ano | findstr "27017"'
      : 'pgrep -x mongod || pgrep -x mongodb';
    
    exec(cmd, (error, stdout) => {
      if (error || !stdout) {
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
};

/**
 * Returns instructions for installing and running MongoDB based on OS
 * @returns string - Installation instructions
 */
export const getMongoDBInstallInstructions = (): string => {
  const os = platform();
  
  let instructions = 'MongoDB is not running. Please ensure it is installed and running.\n\n';
  
  if (os === 'win32') {
    instructions += 'Windows Installation:\n' +
      '1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community\n' +
      '2. Run the installer and follow the prompts\n' +
      '3. Start MongoDB service: Start Menu -> MongoDB -> MongoDB Server -> MongoDB Service\n' +
      '   Or run: net start MongoDB\n';
  } else if (os === 'darwin') {
    instructions += 'macOS Installation:\n' +
      '1. Install with Homebrew: brew install mongodb-community\n' +
      '2. Start MongoDB: brew services start mongodb-community\n';
  } else {
    instructions += 'Linux Installation:\n' +
      '1. Follow the installation instructions for your distribution: https://docs.mongodb.com/manual/administration/install-on-linux/\n' +
      '2. Start MongoDB: sudo systemctl start mongod\n';
  }
  
  instructions += '\nAlternatively, you can use MongoDB Atlas (cloud):\n' +
    '1. Create a free account at https://www.mongodb.com/cloud/atlas\n' +
    '2. Create a new cluster\n' +
    '3. Configure network access and create a database user\n' +
    '4. Get your connection string and update it in the .env file\n';
  
  return instructions;
};

export default { isMongoDBRunning, getMongoDBInstallInstructions }; 