'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown,
  ChevronUp,
  Filter,
  Star,
  DollarSign,
  Tag,
  Monitor,
  Users,
  Lightbulb,
  X
} from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
  count: number;
  avgPrice?: number;
  avgRating?: number;
}

interface PriceRange {
  label: string;
  min: number;
  max: number | null;
}

interface SmartSuggestion {
  type: string;
  value: string;
  label: string;
  reason: string;
}

interface FilterData {
  categories: FilterOption[];
  platforms: FilterOption[];
  priceRanges: PriceRange[];
  ratings: FilterOption[];
  tags: FilterOption[];
  developers: FilterOption[];
  suggestions: SmartSuggestion[];
}

interface IntelligentFiltersProps {
  searchQuery?: string;
  selectedFilters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  onApplyFilters: () => void;
}

export function IntelligentFilters({ 
  searchQuery = '', 
  selectedFilters, 
  onFiltersChange, 
  onApplyFilters 
}: IntelligentFiltersProps) {
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: true,
    platforms: true,
    price: true,
    ratings: true,
    suggestions: true,
  });

  useEffect(() => {
    loadFilterData();
  }, [searchQuery, selectedFilters.category, selectedFilters.platform]);

  const loadFilterData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedFilters.category) params.set('category', selectedFilters.category);
      if (selectedFilters.platform) params.set('platform', selectedFilters.platform);

      const response = await fetch(`/api/search/filters?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setFilterData(data.filters);
      }
    } catch (error) {
      console.error('Error loading filter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (filterType: string, value: string, checked: boolean) => {
    const currentValues = selectedFilters[filterType] || [];
    let newValues;

    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter((v: string) => v !== value);
    }

    onFiltersChange({
      ...selectedFilters,
      [filterType]: newValues.length > 0 ? newValues : undefined,
    });
  };

  const handleSingleFilterChange = (filterType: string, value: string) => {
    onFiltersChange({
      ...selectedFilters,
      [filterType]: value || undefined,
    });
  };

  const handlePriceRangeChange = (range: PriceRange) => {
    onFiltersChange({
      ...selectedFilters,
      price_min: range.min > 0 ? range.min.toString() : undefined,
      price_max: range.max ? range.max.toString() : undefined,
    });
  };

  const applySuggestion = (suggestion: SmartSuggestion) => {
    const newFilters = { ...selectedFilters };
    
    if (suggestion.type === 'category') {
      newFilters.category = suggestion.value;
    } else if (suggestion.type === 'platform') {
      newFilters.platform = suggestion.value;
    } else if (suggestion.type === 'tag') {
      const currentTags = newFilters.tags || [];
      if (!currentTags.includes(suggestion.value)) {
        newFilters.tags = [...currentTags, suggestion.value];
      }
    }

    onFiltersChange(newFilters);
    onApplyFilters();
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const getActiveFilterCount = () => {
    return Object.values(selectedFilters).filter(value => 
      value !== undefined && value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true)
    ).length;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!filterData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Intelligent Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFilterCount()}
              </Badge>
            )}
          </div>
          {getActiveFilterCount() > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Smart Suggestions */}
        {filterData.suggestions.length > 0 && (
          <Collapsible 
            open={expandedSections.suggestions} 
            onOpenChange={() => toggleSection('suggestions')}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                <span className="font-medium">Smart Suggestions</span>
              </div>
              {expandedSections.suggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {filterData.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => applySuggestion(suggestion)}
                >
                  <div className="font-medium text-sm">{suggestion.label}</div>
                  <div className="text-xs text-muted-foreground">{suggestion.reason}</div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Categories */}
        {filterData.categories.length > 0 && (
          <Collapsible 
            open={expandedSections.categories} 
            onOpenChange={() => toggleSection('categories')}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span className="font-medium">Categories</span>
              </div>
              {expandedSections.categories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {filterData.categories.slice(0, 8).map((category) => (
                <div key={category.value} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.value}`}
                      checked={selectedFilters.category === category.value}
                      onCheckedChange={(checked) => 
                        handleSingleFilterChange('category', checked ? category.value : '')
                      }
                    />
                    <Label 
                      htmlFor={`category-${category.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {category.label}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {category.count}
                    </Badge>
                    {category.avgRating && category.avgRating > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 fill-current text-yellow-400" />
                        {category.avgRating.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Platforms */}
        {filterData.platforms.length > 0 && (
          <Collapsible 
            open={expandedSections.platforms} 
            onOpenChange={() => toggleSection('platforms')}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <span className="font-medium">Platforms</span>
              </div>
              {expandedSections.platforms ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {filterData.platforms.map((platform) => (
                <div key={platform.value} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`platform-${platform.value}`}
                      checked={selectedFilters.platform === platform.value}
                      onCheckedChange={(checked) => 
                        handleSingleFilterChange('platform', checked ? platform.value : '')
                      }
                    />
                    <Label 
                      htmlFor={`platform-${platform.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {platform.label}
                    </Label>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {platform.count}
                  </Badge>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Price Ranges */}
        {filterData.priceRanges.length > 0 && (
          <Collapsible 
            open={expandedSections.price} 
            onOpenChange={() => toggleSection('price')}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium">Price Range</span>
              </div>
              {expandedSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {filterData.priceRanges.map((range, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`price-${index}`}
                    checked={
                      selectedFilters.price_min === range.min.toString() &&
                      (range.max === null || selectedFilters.price_max === range.max.toString())
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handlePriceRangeChange(range);
                      } else {
                        onFiltersChange({
                          ...selectedFilters,
                          price_min: undefined,
                          price_max: undefined,
                        });
                      }
                    }}
                  />
                  <Label 
                    htmlFor={`price-${index}`}
                    className="text-sm cursor-pointer"
                  >
                    {range.label}
                  </Label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Ratings */}
        {filterData.ratings.length > 0 && (
          <Collapsible 
            open={expandedSections.ratings} 
            onOpenChange={() => toggleSection('ratings')}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span className="font-medium">Ratings</span>
              </div>
              {expandedSections.ratings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {filterData.ratings.map((rating) => (
                <div key={rating.value} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`rating-${rating.value}`}
                      checked={selectedFilters.rating_min === rating.value.replace('+', '')}
                      onCheckedChange={(checked) => 
                        handleSingleFilterChange('rating_min', checked ? rating.value.replace('+', '') : '')
                      }
                    />
                    <Label 
                      htmlFor={`rating-${rating.value}`}
                      className="text-sm cursor-pointer flex items-center gap-1"
                    >
                      <Star className="w-3 h-3 fill-current text-yellow-400" />
                      {rating.label}
                    </Label>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {rating.count}
                  </Badge>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Developer Verification */}
        {filterData.developers.length > 1 && (
          <Collapsible 
            open={expandedSections.developers} 
            onOpenChange={() => toggleSection('developers')}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="font-medium">Developers</span>
              </div>
              {expandedSections.developers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {filterData.developers.map((dev) => (
                <div key={dev.value} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`dev-${dev.value}`}
                      checked={selectedFilters.verified_only === (dev.value === 'verified')}
                      onCheckedChange={(checked) => 
                        handleSingleFilterChange('verified_only', checked && dev.value === 'verified' ? 'true' : '')
                      }
                    />
                    <Label 
                      htmlFor={`dev-${dev.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {dev.label}
                    </Label>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {dev.count}
                  </Badge>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Apply Filters Button */}
        <Button onClick={onApplyFilters} className="w-full">
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
}
