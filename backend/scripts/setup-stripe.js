const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Path to env file
const envPath = path.resolve(__dirname, '../.env');

// Check if .env file exists
const checkEnvFile = () => {
  if (!fs.existsSync(envPath)) {
    console.log('No .env file found. Creating from .env-example...');
    try {
      const exampleEnvPath = path.resolve(__dirname, '../.env-example');
      if (fs.existsSync(exampleEnvPath)) {
        fs.copyFileSync(exampleEnvPath, envPath);
        console.log('Created .env file from example.');
      } else {
        fs.writeFileSync(envPath, '# Environment Variables\n', 'utf8');
        console.log('Created new .env file.');
      }
    } catch (error) {
      console.error('Error creating .env file:', error);
      process.exit(1);
    }
  }
};

// Update .env file with Stripe keys
const updateEnvFile = (secretKey, webhookSecret = '') => {
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update Stripe secret key
    if (envContent.includes('STRIPE_SECRET_KEY=')) {
      envContent = envContent.replace(
        /STRIPE_SECRET_KEY=.*/g, 
        `STRIPE_SECRET_KEY=${secretKey}`
      );
    } else {
      envContent += `\nSTRIPE_SECRET_KEY=${secretKey}\n`;
    }
    
    // Update webhook secret if provided
    if (webhookSecret) {
      if (envContent.includes('STRIPE_WEBHOOK_SECRET=')) {
        envContent = envContent.replace(
          /STRIPE_WEBHOOK_SECRET=.*/g, 
          `STRIPE_WEBHOOK_SECRET=${webhookSecret}`
        );
      } else {
        envContent += `STRIPE_WEBHOOK_SECRET=${webhookSecret}\n`;
      }
    }
    
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('Updated .env file with Stripe credentials.');
  } catch (error) {
    console.error('Error updating .env file:', error);
    process.exit(1);
  }
};

// Test Stripe configuration
const testStripeConfig = () => {
  try {
    console.log('Testing Stripe configuration...');
    const result = execSync('node test-stripe.js', { cwd: path.resolve(__dirname, '..') });
    console.log(result.toString());
    return true;
  } catch (error) {
    console.error('Error testing Stripe configuration:', error.message);
    return false;
  }
};

// Main function
const setupStripe = () => {
  console.log('=== SportNexus Hub Stripe Setup ===');
  
  // Check/create .env file
  checkEnvFile();
  
  // Ask for Stripe secret key
  rl.question('Enter your Stripe secret key (starts with sk_test_ or sk_live_): ', (secretKey) => {
    if (!secretKey || (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_'))) {
      console.error('Invalid Stripe secret key. It should start with sk_test_ or sk_live_');
      rl.close();
      return;
    }
    
    // Ask for webhook secret (optional)
    rl.question('Enter your Stripe webhook secret (optional, starts with whsec_): ', (webhookSecret) => {
      if (webhookSecret && !webhookSecret.startsWith('whsec_')) {
        console.warn('Warning: Webhook secret should start with whsec_');
      }
      
      // Update .env file
      updateEnvFile(secretKey, webhookSecret);
      
      // Test the configuration
      const success = testStripeConfig();
      
      if (success) {
        console.log('\n✅ Stripe setup completed successfully!');
        console.log('You can now start your server with npm run dev.');
      } else {
        console.log('\n⚠️ Stripe setup completed, but testing failed.');
        console.log('Please check your credentials and try again.');
      }
      
      rl.close();
    });
  });
};

// Start the setup
setupStripe(); 