'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter,
  X,
  Star,
  DollarSign,
  Tag,
  Loader2,
  SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';

interface SearchFilters {
  query: string;
  category: string;
  platform: string;
  price_min: string;
  price_max: string;
  rating_min: string;
  sort_by: string;
}

interface SearchSuggestion {
  text: string;
  type: 'app' | 'category' | 'tag';
  category: string;
}

interface SearchFacets {
  categories: Array<{ value: string; count: number }>;
  platforms: Array<{ value: string; count: number }>;
}

interface AdvancedSearchProps {
  onResults?: (results: any) => void;
  onFiltersChange?: (filters: SearchFilters) => void;
}

export function AdvancedSearch({ onResults, onFiltersChange }: AdvancedSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [facets, setFacets] = useState<SearchFacets>({ categories: [], platforms: [] });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    platform: searchParams.get('platform') || '',
    price_min: searchParams.get('price_min') || '',
    price_max: searchParams.get('price_max') || '',
    rating_min: searchParams.get('rating_min') || '',
    sort_by: searchParams.get('sort_by') || 'relevance',
  });

  useEffect(() => {
    // Load initial search results
    if (filters.query || hasActiveFilters()) {
      performSearch();
    } else {
      loadFacets();
    }
  }, []);

  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  // Handle clicks outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters = () => {
    return filters.category || filters.platform || filters.price_min || 
           filters.price_max || filters.rating_min || filters.sort_by !== 'relevance';
  };

  const performSearch = async () => {
    try {
      setLoading(true);

      const searchQuery = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          searchQuery.set(key, value);
        }
      });

      const response = await fetch(`/api/search?${searchQuery.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        onResults?.(data);
        setFacets(data.facets || { categories: [], platforms: [] });
        
        // Update URL without page reload
        const newUrl = `${window.location.pathname}?${searchQuery.toString()}`;
        window.history.replaceState({}, '', newUrl);
      } else {
        toast.error('Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const loadFacets = async () => {
    try {
      const response = await fetch('/api/search?limit=0');
      if (response.ok) {
        const data = await response.json();
        setFacets(data.facets || { categories: [], platforms: [] });
      }
    } catch (error) {
      console.error('Error loading facets:', error);
    }
  };

  const getAutocompleteSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch('/api/search/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 8 }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
    }
  };

  const handleQueryChange = (value: string) => {
    setFilters(prev => ({ ...prev, query: value }));
    getAutocompleteSuggestions(value);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setFilters(prev => ({ ...prev, query: suggestion.text }));
    setShowSuggestions(false);
    setTimeout(() => performSearch(), 100);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      platform: '',
      price_min: '',
      price_max: '',
      rating_min: '',
      sort_by: 'relevance',
    });
    router.push('/marketplace');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    performSearch();
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'category':
        return <Tag className="w-4 h-4" />;
      case 'tag':
        return <Tag className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search apps, categories, or tags..."
                  value={filters.query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="pl-10 pr-12"
                />
                {loading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin" />
                )}
              </div>

              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 z-50 bg-background border border-border rounded-md shadow-lg mt-1 max-h-64 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 border-b border-border last:border-b-0"
                    >
                      {getSuggestionIcon(suggestion.type)}
                      <span>{suggestion.text}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {suggestion.type}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters() && (
                  <Badge variant="secondary" className="ml-2">
                    {Object.values(filters).filter(Boolean).length - 1}
                  </Badge>
                )}
              </Button>

              {hasActiveFilters() && (
                <Button type="button" variant="ghost" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => handleFilterChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {facets.categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.value} ({category.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Platform Filter */}
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={filters.platform}
                  onValueChange={(value) => handleFilterChange('platform', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All platforms</SelectItem>
                    {facets.platforms.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.value} ({platform.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div>
                <Label htmlFor="sort_by">Sort By</Label>
                <Select
                  value={filters.sort_by}
                  onValueChange={(value) => handleFilterChange('sort_by', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <Label>Price Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.price_min}
                    onChange={(e) => handleFilterChange('price_min', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.price_max}
                    onChange={(e) => handleFilterChange('price_max', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Minimum Rating */}
              <div>
                <Label htmlFor="rating_min">Minimum Rating</Label>
                <Select
                  value={filters.rating_min}
                  onValueChange={(value) => handleFilterChange('rating_min', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any rating</SelectItem>
                    <SelectItem value="4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-current text-yellow-400" />
                        4+ stars
                      </div>
                    </SelectItem>
                    <SelectItem value="3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-current text-yellow-400" />
                        3+ stars
                      </div>
                    </SelectItem>
                    <SelectItem value="2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-current text-yellow-400" />
                        2+ stars
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={performSearch} disabled={loading}>
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {filters.category}
              <button
                onClick={() => handleFilterChange('category', '')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.platform && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Platform: {filters.platform}
              <button
                onClick={() => handleFilterChange('platform', '')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.price_min && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Min Price: ${filters.price_min}
              <button
                onClick={() => handleFilterChange('price_min', '')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.price_max && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Max Price: ${filters.price_max}
              <button
                onClick={() => handleFilterChange('price_max', '')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.rating_min && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Min Rating: {filters.rating_min}+ stars
              <button
                onClick={() => handleFilterChange('rating_min', '')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
