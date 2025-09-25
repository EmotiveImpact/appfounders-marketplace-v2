'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        const selectedResult = searchResults[activeIndex];
        if (selectedResult) {
          router.push(selectedResult.url);
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, activeIndex, searchResults, router]);

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
    setActiveIndex(-1);
    
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
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
              {/* Search input */}
              <form onSubmit={handleSearch} className="relative">
                <div className="flex items-center border-b border-gray-200">
                  <Search className="ml-4 h-5 w-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search docs"
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
                  <div className="px-4 py-2 text-xs text-gray-500 border-l border-gray-200">
                    ESC
                  </div>
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
                    {searchResults.map((result, index) => (
                      <Link
                        key={result.id}
                        href={result.url}
                        onClick={onClose}
                        className={cn(
                          "flex items-center px-4 py-3 transition-colors",
                          activeIndex === index ? "bg-gray-100" : "hover:bg-gray-50"
                        )}
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
                ) : searchQuery.length > 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500">Type at least 3 characters to search</p>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500">No recent searches</p>
                  </div>
                )}
                
                {/* Keyboard shortcuts */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <kbd className="px-2 py-1 bg-white rounded border border-gray-200 font-mono text-xs mr-1">↑</kbd>
                        <kbd className="px-2 py-1 bg-white rounded border border-gray-200 font-mono text-xs mr-1">↓</kbd>
                        <span>to navigate</span>
                      </div>
                      <div className="flex items-center">
                        <kbd className="px-2 py-1 bg-white rounded border border-gray-200 font-mono text-xs mr-1">↵</kbd>
                        <span>to select</span>
                      </div>
                      <div className="flex items-center">
                        <kbd className="px-2 py-1 bg-white rounded border border-gray-200 font-mono text-xs mr-1">ESC</kbd>
                        <span>to close</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">Search by</span>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.5 3.5C4.11929 3.5 3 4.61929 3 6C3 7.38071 4.11929 8.5 5.5 8.5C6.88071 8.5 8 7.38071 8 6C8 4.61929 6.88071 3.5 5.5 3.5ZM4 6C4 5.17157 4.67157 4.5 5.5 4.5C6.32843 4.5 7 5.17157 7 6C7 6.82843 6.32843 7.5 5.5 7.5C4.67157 7.5 4 6.82843 4 6Z" fill="currentColor"/>
                        <path d="M10.5 2.5C9.11929 2.5 8 3.61929 8 5C8 6.38071 9.11929 7.5 10.5 7.5C11.8807 7.5 13 6.38071 13 5C13 3.61929 11.8807 2.5 10.5 2.5ZM9 5C9 4.17157 9.67157 3.5 10.5 3.5C11.3284 3.5 12 4.17157 12 5C12 5.82843 11.3284 6.5 10.5 6.5C9.67157 6.5 9 5.82843 9 5Z" fill="currentColor"/>
                        <path d="M5.5 8.5C4.11929 8.5 3 9.61929 3 11C3 12.3807 4.11929 13.5 5.5 13.5C6.88071 13.5 8 12.3807 8 11C8 9.61929 6.88071 8.5 5.5 8.5ZM4 11C4 10.1716 4.67157 9.5 5.5 9.5C6.32843 9.5 7 10.1716 7 11C7 11.8284 6.32843 12.5 5.5 12.5C4.67157 12.5 4 11.8284 4 11Z" fill="currentColor"/>
                        <path d="M10.5 8.5C9.11929 8.5 8 9.61929 8 11C8 12.3807 9.11929 13.5 10.5 13.5C11.8807 13.5 13 12.3807 13 11C13 9.61929 11.8807 8.5 10.5 8.5ZM9 11C9 10.1716 9.67157 9.5 10.5 9.5C11.3284 9.5 12 10.1716 12 11C12 11.8284 11.3284 12.5 10.5 12.5C9.67157 12.5 9 11.8284 9 11Z" fill="currentColor"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
