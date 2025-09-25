import Link from 'next/link';
import AppCard from './app-card';
import { ArrowRight } from 'lucide-react';

// Mock data for trending apps
const trendingApps = [
  {
    id: '1',
    name: 'TaskFlow Pro',
    description: 'Productivity app with advanced task management features',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c',
    type: 'IOS' as const,
    developer: 'ProductivityLabs',
    rating: 4.8,
  },
  {
    id: '2',
    name: 'FitTrack',
    description: 'Fitness tracking with AI-powered workout recommendations',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c',
    type: 'ANDROID' as const,
    developer: 'HealthTech',
    rating: 4.6,
  },
  {
    id: '3',
    name: 'CodeBuddy',
    description: 'AI coding assistant for developers',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
    type: 'MAC' as const,
    developer: 'DevTools Inc',
    rating: 4.9,
  },
  {
    id: '4',
    name: 'DesignPro',
    description: 'Professional design tool for UI/UX designers',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5',
    type: 'PC' as const,
    developer: 'CreativeTools',
    rating: 4.7,
  },
  {
    id: '5',
    name: 'MindfulMoments',
    description: 'Meditation and mindfulness app with guided sessions',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1545389336-cf090694435e',
    type: 'IOS' as const,
    developer: 'WellnessApps',
    rating: 4.5,
  },
  {
    id: '6',
    name: 'WebBuilder',
    description: 'No-code website builder with professional templates',
    price: 69.99,
    image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e',
    type: 'WEB' as const,
    developer: 'WebTech Solutions',
    rating: 4.4,
  },
  {
    id: '7',
    name: 'PhotoEdit Master',
    description: 'Professional photo editing with AI-powered enhancements',
    price: 54.99,
    image: 'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd',
    type: 'MAC' as const,
    developer: 'CreativePixel',
    rating: 4.7,
  },
  {
    id: '8',
    name: 'BudgetTracker',
    description: 'Personal finance management with expense tracking and insights',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f',
    type: 'ANDROID' as const,
    developer: 'FinanceApps',
    rating: 4.6,
  },
];

const TrendingApps = () => {
  // Display 8 trending apps
  const displayedApps = trendingApps.slice(0, 8);
  
  return (
    <section className="py-16 bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Trending Apps</h2>
            <p className="mt-2 text-xl text-gray-600 max-w-2xl">
              Discover the most popular apps available for lifetime access
            </p>
          </div>
          <Link 
            href="/marketplace" 
            className="mt-4 md:mt-0 inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
          >
            View all apps <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayedApps.map((app) => (
            <AppCard key={app.id} {...app} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingApps;
