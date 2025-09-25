'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  Loader2,
  Search,
  Filter,
  ChevronDown,
  Star,
  Download,
  MessageSquare
} from 'lucide-react';
import Image from 'next/image';

export default function TesterAppsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [apps, setApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);

  useEffect(() => {
    // Check authentication
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
      return;
    }

    // Check if user is tester
    if (!authLoading && isAuthenticated && user?.role !== 'tester') {
      router.push(`/dashboard/${user?.role || ''}`);
      return;
    }

    // Fetch apps data
    const fetchApps = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        setTimeout(() => {
          const mockApps = [
            { 
              id: 'a1', 
              name: 'Task Manager Pro', 
              developer: 'John Doe', 
              category: 'Productivity', 
              price: 4.99, 
              rating: 4.5,
              downloads: 1250,
              description: 'A comprehensive task management application with reminders, categories, and progress tracking.',
              image: 'https://placehold.co/400x400/4F46E5/FFFFFF?text=Task+Manager'
            },
            { 
              id: 'a2', 
              name: 'Budget Tracker', 
              developer: 'Robert Johnson', 
              category: 'Finance', 
              price: 2.99, 
              rating: 4.2,
              downloads: 980,
              description: 'Track your expenses, create budgets, and visualize your spending habits with detailed reports.',
              image: 'https://placehold.co/400x400/10B981/FFFFFF?text=Budget+Tracker'
            },
            { 
              id: 'a3', 
              name: 'Fitness Coach', 
              developer: 'Michael Wilson', 
              category: 'Health', 
              price: 5.99, 
              rating: 4.7,
              downloads: 2100,
              description: 'Personalized workout plans, nutrition guidance, and progress tracking for your fitness journey.',
              image: 'https://placehold.co/400x400/EF4444/FFFFFF?text=Fitness+Coach'
            },
            { 
              id: 'a4', 
              name: 'Recipe Finder', 
              developer: 'Sarah Brown', 
              category: 'Food', 
              price: 0, 
              rating: 4.0,
              downloads: 3500,
              description: 'Discover recipes based on ingredients you have at home. Includes dietary filters and meal planning.',
              image: 'https://placehold.co/400x400/F59E0B/FFFFFF?text=Recipe+Finder'
            },
            { 
              id: 'a5', 
              name: 'Weather Forecast', 
              developer: 'Emily Davis', 
              category: 'Weather', 
              price: 1.99, 
              rating: 4.3,
              downloads: 5200,
              description: 'Accurate weather forecasts with hourly updates, radar maps, and severe weather alerts.',
              image: 'https://placehold.co/400x400/3B82F6/FFFFFF?text=Weather+App'
            },
            { 
              id: 'a6', 
              name: 'Language Translator', 
              developer: 'David Miller', 
              category: 'Education', 
              price: 3.99, 
              rating: 4.6,
              downloads: 1800,
              description: 'Translate text and speech between 50+ languages. Includes offline mode and phrase book.',
              image: 'https://placehold.co/400x400/8B5CF6/FFFFFF?text=Translator'
            },
            { 
              id: 'a7', 
              name: 'Meditation Guide', 
              developer: 'Lisa Taylor', 
              category: 'Health', 
              price: 4.99, 
              rating: 4.8,
              downloads: 2700,
              description: 'Guided meditation sessions for stress relief, better sleep, and improved focus.',
              image: 'https://placehold.co/400x400/EC4899/FFFFFF?text=Meditation'
            },
            { 
              id: 'a8', 
              name: 'Stock Tracker', 
              developer: 'James Anderson', 
              category: 'Finance', 
              price: 9.99, 
              rating: 4.4,
              downloads: 950,
              description: 'Real-time stock market data, portfolio tracking, and investment analysis tools.',
              image: 'https://placehold.co/400x400/14B8A6/FFFFFF?text=Stocks'
            },
          ];
          setApps(mockApps);
          setFilteredApps(mockApps);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching apps:', error);
        setIsLoading(false);
      }
    };

    fetchApps();
  }, [authLoading, isAuthenticated, router, user]);

  // Apply filters and search
  useEffect(() => {
    let result = [...apps];
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter((app: any) => app.category === categoryFilter);
    }
    
    // Apply price filter
    if (priceFilter === 'free') {
      result = result.filter((app: any) => app.price === 0);
    } else if (priceFilter === 'paid') {
      result = result.filter((app: any) => app.price > 0);
    }
    
    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (app: any) => 
          app.name.toLowerCase().includes(search) || 
          app.developer.toLowerCase().includes(search) ||
          app.description.toLowerCase().includes(search)
      );
    }
    
    setFilteredApps(result);
  }, [apps, categoryFilter, priceFilter, searchTerm]);

  // Get unique categories for filter
  const categories = [...new Set(apps.map((app: any) => app.category))];

  // Format price
  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
  };

  // Format rating with stars
  const renderRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center">
        {Array(fullStars).fill(0).map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="h-4 w-4 text-gray-300" />
            <div className="absolute top-0 left-0 overflow-hidden w-1/2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {Array(5 - fullStars - (hasHalfStar ? 1 : 0)).fill(0).map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen">
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="mt-2 text-gray-500">Loading apps...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Available Apps for Testing</h1>
        </div>
        
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search apps..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="relative">
                <select
                  className="appearance-none bg-white dark:bg-gray-700 border rounded-lg px-4 py-2 pr-8"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((category: string) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
              
              <div className="relative">
                <select
                  className="appearance-none bg-white dark:bg-gray-700 border rounded-lg px-4 py-2 pr-8"
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                >
                  <option value="all">All Prices</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Apps Grid */}
        {filteredApps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredApps.map((app: any) => (
              <div 
                key={app.id} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/tester/apps/${app.id}`)}
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={app.image}
                    alt={app.name}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{app.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">by {app.developer}</p>
                  <div className="mb-2">
                    {renderRatingStars(app.rating)}
                  </div>
                  <p className="text-sm mb-3 line-clamp-2 text-gray-600 dark:text-gray-300">
                    {app.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      app.price === 0 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {formatPrice(app.price)}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Download className="h-4 w-4 mr-1" />
                      <span>{app.downloads.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 flex justify-between items-center">
                  <span className="text-xs font-medium px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-full">
                    {app.category}
                  </span>
                  <button 
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/tester/apps/${app.id}/feedback`);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    <span>Give Feedback</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No apps found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
