import { getPayload } from 'payload/dist/payload';
import config from './payload.config';

// Singleton to ensure Payload is only instantiated once
let cached = (global as any).payload;

if (!cached) {
  cached = (global as any).payload = {
    client: null,
    promise: null,
  };
}

interface Args {
  initOptions?: Record<string, unknown>;
}

export const getPayloadClient = async ({ initOptions }: Args = {}) => {
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET environment variable is missing');
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is missing');
  }

  // Return cached client if it exists to improve performance
  if (cached.client) {
    return cached.client;
  }

  // Add performance timing for debugging
  const startTime = Date.now();
  
  if (!cached.promise) {
    console.log('Initializing PayloadCMS...');
    
    try {
      cached.promise = getPayload({
        // Make sure the Payload secret is always passed
        secret: process.env.PAYLOAD_SECRET,
        // Pass the config imported from the config file
        config,
        // Set local to true to run Payload locally instead of connecting to a public-facing API
        local: initOptions?.local !== undefined ? initOptions.local : true,
        // Set onInit to a callback to be executed after Payload initializes
        onInit: async (payload) => {
          console.log('PayloadCMS initialized successfully');
          // If the "seed" param was passed, seed the database with initial data
          if (initOptions?.seed) {
            await seed(payload);
          }
          return payload;
        },
      });
    } catch (error) {
      console.error('Error initializing PayloadCMS:', error);
      throw error;
    }
  }

  try {
    // Wait for the promise to resolve
    const res = await cached.promise;
    
    // Cache the client for future use
    cached.client = res;
    
    // Log performance metrics
    const endTime = Date.now();
    console.log(`PayloadCMS initialization took ${endTime - startTime}ms`);
    
    return res;
  } catch (error) {
    console.error('Error resolving PayloadCMS promise:', error);
    throw error;
  }
};

// Seed the database with initial data
const seed = async (payload: any) => {
  // Create a default admin user if none exists
  const { docs: admins } = await payload.find({
    collection: 'users',
    where: {
      role: {
        equals: 'admin',
      },
    },
  });

  if (admins.length === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email: 'admin@appfounders.com',
        password: 'adminPassword123',
        role: 'admin',
        name: 'Admin User',
      },
    });
    console.log('Created admin user');
  }

  // Add more seed data as needed
  console.log('Seeding complete');
};
