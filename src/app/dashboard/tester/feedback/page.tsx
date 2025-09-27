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
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

// Define feedback status types
type FeedbackStatus = 'pending' | 'reviewed' | 'implemented' | 'declined';

// Define feedback interface
interface Feedback {
  id: string;
  appId: string;
  appName: string;
  appImage: string;
  content: string;
  rating: number;
  category: string;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
  developerResponse?: {
    content: string;
    createdAt: string;
  };
}

export default function TesterFeedbackPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<Feedback[]>([]);

  useEffect(() => {
    // Check authentication
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
      return;
    }

    // Check if user is tester
    if (!authLoading && isAuthenticated && (user as any)?.role !== 'tester') {
      router.push(`/dashboard/${(user as any)?.role || ''}`);
      return;
    }

    // Fetch feedback data
    const fetchFeedback = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        setTimeout(() => {
          const mockFeedback: Feedback[] = [
            {
              id: 'f1',
              appId: 'a1',
              appName: 'Task Manager Pro',
              appImage: 'https://placehold.co/400x400/4F46E5/FFFFFF?text=Task+Manager',
              content: 'The reminder feature doesn\'t work consistently. Sometimes notifications don\'t appear at the scheduled time.',
              rating: 3,
              category: 'Bug',
              status: 'reviewed',
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              developerResponse: {
                content: 'Thank you for reporting this issue. We\'ve identified the problem and are working on a fix for our next update.',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
              }
            },
            {
              id: 'f2',
              appId: 'a2',
              appName: 'Budget Tracker',
              appImage: 'https://placehold.co/400x400/10B981/FFFFFF?text=Budget+Tracker',
              content: 'Would be great to have a feature that allows importing transactions from bank statements.',
              rating: 4,
              category: 'Feature Request',
              status: 'implemented',
              createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              developerResponse: {
                content: 'Great suggestion! We\'ve implemented this feature in our latest update (v2.3.0). You can now import transactions from CSV files exported from most major banks.',
                createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
              }
            },
            {
              id: 'f3',
              appId: 'a3',
              appName: 'Fitness Coach',
              appImage: 'https://placehold.co/400x400/EF4444/FFFFFF?text=Fitness+Coach',
              content: 'The app crashes when trying to sync with my fitness tracker.',
              rating: 2,
              category: 'Bug',
              status: 'pending',
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'f4',
              appId: 'a4',
              appName: 'Recipe Finder',
              appImage: 'https://placehold.co/400x400/F59E0B/FFFFFF?text=Recipe+Finder',
              content: 'The UI is not very intuitive. It takes too many clicks to find recipes based on ingredients.',
              rating: 3,
              category: 'UI/UX',
              status: 'declined',
              createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
              developerResponse: {
                content: 'Thank you for your feedback. We\'ve considered your suggestion, but our user testing indicates that the current UI works well for the majority of our users. We\'ll keep monitoring feedback on this issue.',
                createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
              }
            },
            {
              id: 'f5',
              appId: 'a5',
              appName: 'Weather Forecast',
              appImage: 'https://placehold.co/400x400/3B82F6/FFFFFF?text=Weather+App',
              content: 'Would love to see a dark mode option for the app.',
              rating: 4,
              category: 'Feature Request',
              status: 'implemented',
              createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
              developerResponse: {
                content: 'We\'ve added dark mode in our latest update! You can toggle it in the settings menu or set it to follow your system preferences.',
                createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString()
              }
            },
            {
              id: 'f6',
              appId: 'a6',
              appName: 'Language Translator',
              appImage: 'https://placehold.co/400x400/8B5CF6/FFFFFF?text=Translator',
              content: 'The offline mode doesn\'t work as expected. It still tries to connect to the internet.',
              rating: 2,
              category: 'Bug',
              status: 'reviewed',
              createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              developerResponse: {
                content: 'We\'ve identified the issue and are working on a fix. In the meantime, please make sure you\'ve downloaded the language packs before going offline.',
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
              }
            }
          ];
          setFeedback(mockFeedback);
          setFilteredFeedback(mockFeedback);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching feedback:', error);
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, [authLoading, isAuthenticated, router, user]);

  // Apply filters and search
  useEffect(() => {
    let result = [...feedback];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(item => item.category === categoryFilter);
    }
    
    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        item => 
          item.appName.toLowerCase().includes(search) || 
          item.content.toLowerCase().includes(search) ||
          (item.developerResponse?.content.toLowerCase().includes(search))
      );
    }
    
    setFilteredFeedback(result);
  }, [feedback, statusFilter, categoryFilter, searchTerm]);

  // Get unique categories for filter
  const categories = Array.from(new Set(feedback.map(item => item.category)));

  // Format rating with stars
  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {Array(5).fill(0).map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  // Get status badge
  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <MessageSquare className="h-3 w-3 mr-1" />
            Reviewed
          </span>
        );
      case 'implemented':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Implemented
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Declined
          </span>
        );
      default:
        return null;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen">
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="mt-2 text-gray-500">Loading feedback...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Feedback</h1>
          <button 
            onClick={() => router.push('/dashboard/tester/apps')}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Test New Apps
          </button>
        </div>
        
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search feedback..."
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
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="implemented">Implemented</option>
                  <option value="declined">Declined</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
              
              <div className="relative">
                <select
                  className="appearance-none bg-white dark:bg-gray-700 border rounded-lg px-4 py-2 pr-8"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Feedback List */}
        {filteredFeedback.length > 0 ? (
          <div className="space-y-6">
            {filteredFeedback.map(item => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start">
                    <div className="relative h-12 w-12 rounded-md overflow-hidden flex-shrink-0 mr-4">
                      <Image
                        src={item.appImage}
                        alt={item.appName}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{item.appName}</h3>
                          <div className="flex items-center mt-1 space-x-2">
                            {renderRatingStars(item.rating)}
                            <span className="text-sm text-gray-500">
                              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.category}
                          </span>
                          {getStatusBadge(item.status)}
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-gray-700 dark:text-gray-300">{item.content}</p>
                      </div>
                      
                      {item.developerResponse && (
                        <div className="mt-4 pl-4 border-l-2 border-gray-200">
                          <p className="text-sm text-gray-500 mb-1">Developer Response:</p>
                          <p className="text-gray-700 dark:text-gray-300">{item.developerResponse.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(item.developerResponse.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-3 flex justify-end">
                  <button 
                    onClick={() => router.push(`/dashboard/tester/apps/${item.appId}`)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View App
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No feedback found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
