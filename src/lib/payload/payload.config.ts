import { buildConfig } from 'payload/config';
import path from 'path';
import { Users } from './collections/Users';
import { Apps } from './collections/Apps';
import { Purchases } from './collections/Purchases';
import { Reviews } from './collections/Reviews';
import { Media } from './collections/Media';
import { Bugs } from './collections/Bugs';
import { Blogs } from './collections/Blogs';

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '- AppFounders Admin',
      favicon: '/favicon.ico',
      ogImage: '/og-image.jpg',
    },
  },
  collections: [
    Users,
    Apps,
    Purchases,
    Reviews,
    Media,
    Bugs,
    Blogs,
  ],
  typescript: {
    outputFile: path.resolve(__dirname, '../../../payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, '../../../generated-schema.graphql'),
  },
  cors: ['https://appfounders.com', 'http://localhost:3000'],
  csrf: [
    'https://appfounders.com',
    'http://localhost:3000',
  ],
  rateLimit: {
    max: 500,
    window: 15 * 60 * 1000, // 15 minutes
  },
  // Global richText configuration for PayloadCMS v2
  richText: {
    defaultElement: 'paragraph',
    elements: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'link', 'ol', 'ul', 'indent',
      'relationship', 'upload', 'textAlign',
    ],
    leaves: [
      'bold', 'italic', 'underline', 'strikethrough', 'code'
    ],
  },
  // MongoDB configuration for PayloadCMS v2
  mongo: {
    url: process.env.MONGODB_URI || 'mongodb://localhost/appfounders',
  },
});
