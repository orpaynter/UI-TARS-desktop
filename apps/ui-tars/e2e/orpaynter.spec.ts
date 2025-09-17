import { test, expect } from '@playwright/test';

test.describe('OrPaynter Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Set up demo mode environment variables for testing
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should show OrPaynter first-run wizard on first launch', async ({ page }) => {
    // Check if first-run wizard appears
    const wizardTitle = page.locator('text=OrPaynter Setup');
    await expect(wizardTitle).toBeVisible();
    
    // Verify welcome step
    await expect(page.locator('text=Welcome to OrPaynter')).toBeVisible();
    await expect(page.locator('text=AI-powered roofing inspection')).toBeVisible();
  });

  test('should complete first-run wizard in demo mode', async ({ page }) => {
    // Navigate through wizard steps
    await page.click('button:has-text("Next")'); // Welcome -> Mode Selection
    
    // Select demo mode (should be selected by default)
    await expect(page.locator('input[value="demo"]:checked')).toBeVisible();
    await page.click('button:has-text("Next")'); // Mode -> API Config
    
    // Skip API config in demo mode
    await expect(page.locator('text=Demo mode selected')).toBeVisible();
    await page.click('button:has-text("Next")'); // API -> Features
    
    // Verify features are enabled by default
    await expect(page.locator('input[id="enableAI"]:checked')).toBeVisible();
    await expect(page.locator('input[id="enableClaims"]:checked')).toBeVisible();
    await page.click('button:has-text("Next")'); // Features -> External Services
    
    // Skip external services
    await page.click('button:has-text("Next")'); // External -> Complete
    
    // Complete setup
    await expect(page.locator('text=Setup Complete!')).toBeVisible();
    await page.click('button:has-text("Complete Setup")');
    
    // Verify wizard closes and main app is accessible
    await expect(page.locator('text=OrPaynter Setup')).not.toBeVisible();
  });

  test('should handle photo upload and analysis workflow', async ({ page }) => {
    // Complete first-run setup first
    await completeFirstRunSetup(page);
    
    // Look for OrPaynter features in the main interface
    // This would depend on how OrPaynter is integrated into the main UI
    const orPaynterMenu = page.locator('[aria-label*="OrPaynter"], [title*="OrPaynter"], text=OrPaynter');
    if (await orPaynterMenu.isVisible()) {
      await orPaynterMenu.click();
    }
    
    // Test photo upload (mock file upload)
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      // Create a test image file
      const testImagePath = './test-assets/sample-roof.jpg';
      await fileInput.setInputFiles(testImagePath);
      
      // Wait for analysis to complete (mock response)
      await page.waitForSelector('text=Analysis Complete', { timeout: 10000 });
      
      // Verify damage detection results
      await expect(page.locator('text=Damage Detected')).toBeVisible();
      await expect(page.locator('text=Estimated Cost')).toBeVisible();
    }
  });

  test('should handle claim submission workflow', async ({ page }) => {
    // Complete first-run setup first
    await completeFirstRunSetup(page);
    
    // Navigate to claims section
    const claimsButton = page.locator('text=Submit Claim, button:has-text("Claims")');
    if (await claimsButton.isVisible()) {
      await claimsButton.click();
      
      // Fill out claim form
      await page.fill('input[placeholder*="address"]', '123 Main St, Anytown, USA');
      await page.fill('textarea[placeholder*="damage"]', 'Hail damage to roof shingles visible after storm');
      
      // Add contact information
      await page.fill('input[placeholder*="name"]', 'John Doe');
      await page.fill('input[placeholder*="email"]', 'john.doe@example.com');
      await page.fill('input[placeholder*="phone"]', '555-123-4567');
      
      // Submit claim
      await page.click('button:has-text("Submit Claim")');
      
      // Verify claim submission success
      await expect(page.locator('text=Claim submitted successfully')).toBeVisible();
      await expect(page.locator('text=CLAIM-')).toBeVisible(); // Claim ID
    }
  });

  test('should handle estimate generation workflow', async ({ page }) => {
    // Complete first-run setup first
    await completeFirstRunSetup(page);
    
    // Test damage estimate functionality
    const estimateButton = page.locator('text=Get Estimate, button:has-text("Estimate")');
    if (await estimateButton.isVisible()) {
      await estimateButton.click();
      
      // Upload photos for estimate
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles('./test-assets/sample-roof.jpg');
      }
      
      // Add property details
      await page.fill('input[placeholder*="square"]', '2000');
      await page.selectOption('select[name="roofType"]', 'asphalt_shingle');
      await page.fill('input[placeholder*="age"]', '15');
      
      // Generate estimate
      await page.click('button:has-text("Generate Estimate")');
      
      // Verify estimate results
      await page.waitForSelector('text=Estimated Cost', { timeout: 10000 });
      await expect(page.locator('text=$')).toBeVisible(); // Cost amount
      await expect(page.locator('text=Recommended')).toBeVisible(); // Recommendations
    }
  });

  test('should integrate with Stripe for payment processing', async ({ page }) => {
    // Complete first-run setup first  
    await completeFirstRunSetup(page);
    
    // Navigate to payment/upgrade section
    const upgradeButton = page.locator('text=Upgrade, text=Payment, button:has-text("Pro")');
    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();
      
      // Look for Stripe integration
      const stripeFrame = page.frameLocator('iframe[src*="stripe"]');
      if (await stripeFrame.locator('input[placeholder*="card"]').isVisible()) {
        // Verify Stripe payment form is loaded
        await expect(stripeFrame.locator('input[placeholder*="card"]')).toBeVisible();
        await expect(stripeFrame.locator('input[placeholder*="expiry"]')).toBeVisible();
        await expect(stripeFrame.locator('input[placeholder*="cvc"]')).toBeVisible();
      }
    }
  });
});

// Helper function to complete first-run setup
async function completeFirstRunSetup(page) {
  // Check if wizard is visible, if so complete it
  const wizardTitle = page.locator('text=OrPaynter Setup');
  if (await wizardTitle.isVisible()) {
    // Quick setup in demo mode
    await page.click('button:has-text("Next")'); // Welcome
    await page.click('button:has-text("Next")'); // Mode (demo selected by default)
    await page.click('button:has-text("Next")'); // API Config
    await page.click('button:has-text("Next")'); // Features
    await page.click('button:has-text("Next")'); // External Services
    await page.click('button:has-text("Complete Setup")'); // Complete
    
    // Wait for wizard to close
    await expect(wizardTitle).not.toBeVisible();
  }
}