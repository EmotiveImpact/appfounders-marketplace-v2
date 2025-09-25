'use client';

import { useState, useEffect } from 'react';
import AppCard from '@/components/marketplace/app-card';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useMarketplace } from '@/lib/hooks/useMarketplace';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from '@/lib/utils';
import PlatformLogo from '@/components/ui/platform-logo';

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  const {
    apps,
    totalApps,
    isLoading,
    filters,
    updateFilters,
    resetFilters,
  } = useMarketplace();

  // Available categories from mock data
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'design', label: 'Design' },
    { value: 'development', label: 'Development' },
    { value: 'productivity', label: 'Productivity' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'health', label: 'Health & Fitness' },
    { value: 'education', label: 'Education' },
    { value: 'social', label: 'Social' },
  ];

  // Platform options
  const platforms = [
    { value: 'all', label: 'All Platforms' },
    { value: 'MAC', label: 'macOS' },
    { value: 'PC', label: 'Windows' },
    { value: 'IOS', label: 'iOS' },
    { value: 'ANDROID', label: 'Android' },
    { value: 'WEB', label: 'Web' },
  ];

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating_desc', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' },
  ];

  // Handle search
  const handleSearch = () => {
    updateFilters({ search: searchQuery });
    updateActiveFilters();
  };

  // Handle search input keypress
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    resetFilters();
    setActiveFilters([]);
  };

  // Update price range filter
  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange(value);
    updateFilters({ 
      minPrice: value[0].toString(), 
      maxPrice: value[1].toString() 
    });
    updateActiveFilters();
  };

  // Handle category change
  const handleCategoryChange = (value: string) => {
    updateFilters({ category: value });
    updateActiveFilters();
  };

  // Handle platform change
  const handlePlatformChange = (value: string) => {
    updateFilters({ platform: value });
    updateActiveFilters();
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    updateFilters({ sort: value });
  };

  // Update active filters array for badges
  const updateActiveFilters = () => {
    const newActiveFilters: string[] = [];
    
    if (filters.category && filters.category !== 'all') {
      const category = categories.find(c => c.value === filters.category);
      if (category) newActiveFilters.push(`Category: ${category.label}`);
    }
    
    if (filters.platform && filters.platform !== 'all') {
      const platform = platforms.find(p => p.value === filters.platform);
      if (platform) newActiveFilters.push(`Platform: ${platform.label}`);
    }
    
    if (filters.minPrice || filters.maxPrice) {
      const min = filters.minPrice ? parseInt(filters.minPrice) : 0;
      const max = filters.maxPrice ? parseInt(filters.maxPrice) : 200;
      newActiveFilters.push(`Price: ${formatCurrency(min)} - ${formatCurrency(max)}`);
    }
    
    setActiveFilters(newActiveFilters);
  };

  // Remove a specific filter
  const removeFilter = (filter: string) => {
    if (filter.startsWith('Category:')) {
      updateFilters({ category: 'all' });
    } else if (filter.startsWith('Platform:')) {
      updateFilters({ platform: 'all' });
    } else if (filter.startsWith('Price:')) {
      updateFilters({ minPrice: '', maxPrice: '' });
      setPriceRange([0, 200]);
    }
    updateActiveFilters();
  };

  // Update active filters when filters change
  useEffect(() => {
    updateActiveFilters();
  }, [filters]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="flex-1">
        {/* Hero section */}
        <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
          >
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                App Marketplace
                <span className="block text-lg md:text-xl font-normal mt-2 opacity-90">
                  One-time payment. Lifetime updates.
                </span>
              </h1>
              <p className="text-lg opacity-90 mb-8 max-w-2xl">
                Discover innovative digital solutions from independent developers.
                Support creators directly and get lifetime access to quality apps.
              </p>
              
              {/* Search bar */}
              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search apps, developers, or features..."
                  className="w-full pl-12 pr-4 py-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                />
                <Button 
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-xl px-4 py-2 bg-white text-indigo-700 hover:bg-white/90"
                >
                  Search
                </Button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Filter bar */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Mobile filter button */}
              <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden flex items-center gap-2">
                    <Filter size={16} />
                    <span>Filters</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                      Refine your app search with these filters
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="py-6 space-y-6">
                    {/* Category filter */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">Category</h3>
                      <Select 
                        value={filters.category || 'all'} 
                        onValueChange={handleCategoryChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Platform filter */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">Platform</h3>
                      <Select 
                        value={filters.platform || 'all'} 
                        onValueChange={handlePlatformChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          {platforms.map((platform) => (
                            <SelectItem key={platform.value} value={platform.value}>
                              {platform.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Price range filter */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium">Price Range</h3>
                        <span className="text-xs text-gray-500">
                          {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                        </span>
                      </div>
                      <Slider
                        defaultValue={[0, 200]}
                        max={200}
                        step={5}
                        value={priceRange}
                        onValueChange={handlePriceRangeChange}
                        className="my-6"
                      />
                    </div>
                  </div>
                  
                  <SheetFooter>
                    <SheetClose asChild>
                      <Button onClick={() => setShowMobileFilters(false)}>Apply Filters</Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
              
              {/* Desktop filters */}
              <div className="hidden lg:flex items-center space-x-3">
                {/* Category dropdown */}
                <Select 
                  value={filters.category || 'all'} 
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Platform dropdown */}
                <Select 
                  value={filters.platform || 'all'} 
                  onValueChange={handlePlatformChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Price range dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <span>Price</span>
                      <ChevronDown size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[220px] p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Price Range</span>
                        <span className="text-xs text-gray-500">
                          {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                        </span>
                      </div>
                      <Slider
                        defaultValue={[0, 200]}
                        max={200}
                        step={5}
                        value={priceRange}
                        onValueChange={handlePriceRangeChange}
                      />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Sort dropdown */}
              <Select 
                value={filters.sort || 'newest'} 
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Active filters */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-xs text-gray-500">Active filters:</span>
                {activeFilters.map((filter) => (
                  <Badge key={filter} variant="secondary" className="flex items-center gap-1">
                    {filter}
                    <button onClick={() => removeFilter(filter)}>
                      <X size={14} />
                    </button>
                  </Badge>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearSearch} 
                  className="text-xs text-gray-500"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Apps grid */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {filters.search ? `Search results for "${filters.search}"` : 'All Apps'}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({apps.length} {apps.length === 1 ? 'app' : 'apps'})
              </span>
            </h2>
            
            {filters.search && (
              <Button 
                variant="outline" 
                onClick={clearSearch}
                className="text-sm"
              >
                Clear Search
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : apps.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {apps.map((app) => (
                <AppCard 
                  key={app.id} 
                  id={app.id}
                  name={app.name}
                  description={app.description}
                  price={app.price}
                  image={app.image}
                  type={app.type}
                  developer={app.developer}
                  rating={app.rating}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-xl font-medium text-gray-900 mb-2">No apps found</h3>
              <p className="text-gray-500 mb-6">
                We couldn't find any apps matching your search criteria.
              </p>
              <Button onClick={clearSearch} variant="outline">
                Clear Search
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
