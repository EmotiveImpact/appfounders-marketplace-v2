import { getPayloadClient } from '@/lib/payload/payload';

// Initialize Payload CMS
export const initPayload = async () => {
  try {
    const payload = await getPayloadClient({
      initOptions: {
        local: true,
        // Set to true to seed the database with initial data
        seed: process.env.PAYLOAD_SEED === 'true',
      },
    });
    
    console.log('Payload CMS initialized successfully');
    return payload;
  } catch (error) {
    console.error('Error initializing Payload CMS:', error);
    throw error;
  }
};
