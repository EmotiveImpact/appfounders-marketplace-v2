'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSearch = ({ isOpen, onClose }: GlobalSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Mock search function - replace with actual API call
  const performSearch = (query: string) => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Mock results
      const mockResults = [
        { id: '1', title: 'Photo Editor Pro', type: 'App', url: '/marketplace/photo-editor-pro' },
        { id: '2', title: 'Task Manager', type: 'App', url: '/marketplace/task-manager' },
        { id: '3', title: 'How to submit your app', type: 'Article', url: '/blog/submit-your-app' },
        { id: '4', title: 'Developer Documentation', type: 'Resource', url: '/resources/documentation' },
      ].filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(mockResults);
      setIsLoading(false);
    }, 300);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 2) {
      performSearch(query);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Search modal */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
          >
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              {/* Search input */}
              <form onSubmit={handleSearch} className="relative">
                <div className="flex items-center border-b border-gray-200">
                  <Search className="ml-4 h-5 w-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search apps, resources, documentation..."
                    className="w-full px-4 py-4 focus:outline-none text-gray-700 focus:ring-2 focus:ring-indigo-200"
                    value={searchQuery}
                    onChange={handleInputChange}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="mr-2 p-1 rounded-full hover:bg-gray-100"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white p-4 hover:bg-indigo-700 transition-colors rounded-r-xl"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </form>
              
              {/* Search results */}
              <div className="max-h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-pulse inline-block h-6 w-6 rounded-full bg-indigo-200"></div>
                    <p className="text-sm text-gray-500 mt-2">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result) => (
                      <Link
                        key={result.id}
                        href={result.url}
                        onClick={onClose}
                        className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{result.title}</p>
                          <p className="text-xs text-gray-500">{result.type}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </Link>
                    ))}
                  </div>
                ) : searchQuery.length > 2 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500">No results found for "{searchQuery}"</p>
                  </div>
                ) : null}
                
                {searchQuery.length > 0 && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Press Enter to search or click on a result
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearch;
