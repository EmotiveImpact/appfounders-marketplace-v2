'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Filter, Calendar, User } from 'lucide-react';
import { getBlogPosts } from '@/lib/services/blogService';
import { BlogPost, BlogCategory } from '@/types/blog';
import { useRouter, useSearchParams } from 'next/navigation';

// Categories for filtering
const categories = [
  { label: 'All', value: 'all' },
  { label: 'App Development', value: 'app-development' },
  { label: 'UX Design', value: 'ux-design' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Business', value: 'business' },
  { label: 'Technology', value: 'technology' },
];

export default function BlogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Get query parameters
  useEffect(() => {
    const category = searchParams.get('category');
    const query = searchParams.get('q');
    const pageParam = searchParams.get('page');
    
    if (category) setSelectedCategory(category);
    if (query) setSearchQuery(query);
    if (pageParam) setPage(parseInt(pageParam, 10));
  }, [searchParams]);

  // Fetch blog posts
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const category = selectedCategory !== 'all' ? selectedCategory as BlogCategory : undefined;
        const response = await getBlogPosts(page, 9, category);
        
        setBlogs(response.docs);
        setTotalPages(response.totalPages);
        setError(null);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Failed to load blog posts. Please try again later.');
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [page, selectedCategory]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL with search parameters
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    params.set('page', '1');
    
    router.push(`/blog?${params.toString()}`);
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
    
    // Update URL with category parameter
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (category !== 'all') params.set('category', category);
    params.set('page', '1');
    
    router.push(`/blog?${params.toString()}`);
  };

  // Format date to more readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Calculate read time (approximately 200 words per minute)
  const calculateReadTime = (content: any): string => {
    if (!content) return '3 min read';
    
    // For rich text content, we need to extract text
    let text = '';
    if (typeof content === 'string') {
      text = content;
    } else if (Array.isArray(content)) {
      // Handle rich text format
      text = content
        .map(node => {
          if (typeof node === 'string') return node;
          if (node.children) return node.children.map(child => child.text || '').join(' ');
          return '';
        })
        .join(' ');
    }
    
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-600 py-16">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">AppFounders Blog</h1>
          <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
            Insights, tutorials, and news from the app development community
          </p>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 space-y-4 md:space-y-0">
          <div className="relative w-full md:w-1/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-500">Filter by:</span>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading blog posts...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12 bg-red-50 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Featured Article */}
        {!loading && !error && blogs.length > 0 && (
          <div className="mb-16">
            <Link href={`/blog/${blogs[0].slug}`} className="block">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="md:flex">
                  <div className="md:flex-shrink-0 md:w-2/5 relative h-64 md:h-auto">
                    <Image
                      src={blogs[0].featuredImage.url}
                      alt={blogs[0].title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-8 md:w-3/5">
                    <div className="uppercase tracking-wide text-sm text-indigo-600 font-semibold">
                      {categories.find(c => c.value === blogs[0].category)?.label || blogs[0].category}
                    </div>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                      {blogs[0].title}
                    </h2>
                    <p className="mt-3 text-gray-600">
                      {blogs[0].summary}
                    </p>
                    <div className="mt-6 flex items-center flex-wrap">
                      <div className="flex items-center text-sm text-gray-500 mr-2">
                        <User className="h-4 w-4 mr-1" />
                        {typeof blogs[0].author === 'string' ? blogs[0].author : blogs[0].author.name}
                      </div>
                      <span className="mx-2 text-gray-500">•</span>
                      <div className="flex items-center text-sm text-gray-500 mr-2">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(blogs[0].publishedDate)}
                      </div>
                      <span className="mx-2 text-gray-500">•</span>
                      <div className="text-sm text-gray-500">
                        {calculateReadTime(blogs[0].content)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Blog Grid */}
        {!loading && !error && blogs.length > 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.slice(1).map((blog) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`} className="block">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
                  <div className="relative h-48">
                    <Image
                      src={blog.featuredImage.url}
                      alt={blog.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6 flex-grow">
                    <div className="uppercase tracking-wide text-sm text-indigo-600 font-semibold">
                      {categories.find(c => c.value === blog.category)?.label || blog.category}
                    </div>
                    <h3 className="mt-2 text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                      {blog.title}
                    </h3>
                    <p className="mt-3 text-gray-600 line-clamp-3">
                      {blog.summary}
                    </p>
                  </div>
                  <div className="px-6 pb-6 mt-auto">
                    <div className="flex items-center text-sm text-gray-500 flex-wrap">
                      <User className="h-4 w-4 mr-1" />
                      {typeof blog.author === 'string' ? blog.author : blog.author.name}
                      <span className="mx-2">•</span>
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(blog.publishedDate)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : !loading && !error && blogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mt-6 text-xl font-medium text-gray-900">No articles found</h3>
            <p className="mt-2 text-gray-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        ) : null}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={`px-3 py-1 rounded-md ${
                  page === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1 rounded-md ${
                    page === pageNum
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className={`px-3 py-1 rounded-md ${
                  page === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </nav>
          </div>
        )}

        {/* Create Blog Button (for authorized users) */}
        <div className="mt-16 text-center">
          <Link 
            href="/api/payload/admin"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Manage Blog Posts
          </Link>
          <p className="mt-2 text-sm text-gray-500">
            Access the admin panel to create and manage blog content
          </p>
        </div>
      </div>
    </div>
  );
}
