/**
 * Service for interacting with Payload CMS API on the server side
 */

// Mock payload object for TypeScript compatibility
const payload = null;


/**
 * Get all apps with optional filtering
 */
export async function getApps(filters?: Record<string, any>) {
  try {
    const query = {
      where: {
        ...(filters || {}),
        status: {
          equals: 'published',
        },
      },
    };
    
    return await (payload as any)?.find({
      collection: 'apps',
      ...query,
    });
  } catch (error) {
    console.error('Error fetching apps:', error);
    throw error;
  }
}

/**
 * Get a single app by ID
 */
export async function getAppById(id: string) {
  try {
    return await (payload as any)?.findByID({
      collection: 'apps',
      id,
    });
  } catch (error) {
    console.error(`Error fetching app with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new app
 */
export async function createApp(data: any) {
  try {
    return await (payload as any)?.create({
      collection: 'apps',
      data,
    });
  } catch (error) {
    console.error('Error creating app:', error);
    throw error;
  }
}

/**
 * Update an existing app
 */
export async function updateApp(id: string, data: any) {
  try {
    return await (payload as any)?.update({
      collection: 'apps',
      id,
      data,
    });
  } catch (error) {
    console.error(`Error updating app with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Delete an app
 */
export async function deleteApp(id: string) {
  try {
    return await (payload as any)?.delete({
      collection: 'apps',
      id,
    });
  } catch (error) {
    console.error(`Error deleting app with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Process a purchase
 * This handles the 80/20 commission split
 */
export async function processPurchase(appId: string, testerId: string) {
  try {
    
    // Get the app
    const app = await (payload as any)?.findByID({
      collection: 'apps',
      id: appId,
    });
    
    if (!app) {
      throw new Error('App not found');
    }
    
    const { price, developer } = app;
    
    // Calculate platform fee (20%) and developer payout (80%)
    const platformFee = Math.round((price * 0.2) * 100) / 100;
    const developerPayout = Math.round((price * 0.8) * 100) / 100;
    
    // Create the purchase record
    const purchase = await (payload as any)?.create({
      collection: 'purchases',
      data: {
        app: appId,
        tester: testerId,
        developer,
        amount: price,
        platformFee,
        developerPayout,
        status: 'completed',
        purchaseDate: new Date().toISOString(),
      },
    });
    
    // Update the app's purchase count
    await (payload as any)?.update({
      collection: 'apps',
      id: appId,
      data: {
        purchaseCount: (app.purchaseCount || 0) + 1,
      },
    });
    
    // Update the user's purchased apps
    const tester = await (payload as any)?.findByID({
      collection: 'users',
      id: testerId,
    });
    
    const purchasedApps = [...(tester.purchasedApps || []), appId];
    
    await (payload as any)?.update({
      collection: 'users',
      id: testerId,
      data: {
        purchasedApps,
      },
    });
    
    return purchase;
  } catch (error) {
    console.error('Error processing purchase:', error);
    throw error;
  }
}

/**
 * Get purchases for a specific user
 */
export async function getUserPurchases(userId: string) {
  try {
    return await (payload as any)?.find({
      collection: 'purchases',
      where: {
        tester: {
          equals: userId,
        },
      },
      depth: 2, // Include related app data
    });
  } catch (error) {
    console.error(`Error fetching purchases for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get sales for a specific developer
 */
export async function getDeveloperSales(developerId: string) {
  try {
    return await (payload as any)?.find({
      collection: 'purchases',
      where: {
        developer: {
          equals: developerId,
        },
      },
      depth: 2, // Include related app and tester data
    });
  } catch (error) {
    console.error(`Error fetching sales for developer ${developerId}:`, error);
    throw error;
  }
}
