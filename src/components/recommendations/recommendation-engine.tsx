'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles,
  TrendingUp,
  Users,
  Target,
  Star,
  DollarSign,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface App {
  id: string;
  name: string;
  short_description: string;
  price: number;
  developer_name: string;
  developer_verified: boolean;
  rating_average: number;
  rating_count: number;
  category: string;
  platforms: string[];
  icon_url?: string;
  recommendation_score?: number;
  trending_score?: number;
  similar_user_purchases?: number;
  category_preference?: number;
}

interface RecommendationEngineProps {
  appId?: string;
  className?: string;
}

export function RecommendationEngine({ appId, className }: RecommendationEngineProps) {
  const [recommendations, setRecommendations] = useState<Record<string, App[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('personalized');

  const recommendationTypes = [
    {
      key: 'personalized',
      label: 'For You',
      icon: Sparkles,
      description: 'Based on your preferences and activity',
    },
    {
      key: 'trending',
      label: 'Trending',
      icon: TrendingUp,
      description: 'Popular apps right now',
    },
    {
      key: 'collaborative',
      label: 'Similar Users',
      icon: Users,
      description: 'Loved by users like you',
    },
    {
      key: 'category',
      label: 'Your Categories',
      icon: Target,
      description: 'More from your favorite categories',
    },
  ];

  // Add similar apps tab if appId is provided
  if (appId) {
    recommendationTypes.unshift({
      key: 'similar',
      label: 'Similar Apps',
      icon: Target,
      description: 'Apps similar to this one',
    });
  }

  useEffect(() => {
    // Load initial recommendations
    loadRecommendations(activeTab);
  }, [activeTab, appId]);

  const loadRecommendations = async (type: string) => {
    if (recommendations[type] && recommendations[type].length > 0) {
      return; // Already loaded
    }

    try {
      setLoading(prev => ({ ...prev, [type]: true }));

      const params = new URLSearchParams({
        type,
        limit: '8',
      });

      if (appId && type === 'similar') {
        params.set('app_id', appId);
      }

      const response = await fetch(`/api/recommendations?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setRecommendations(prev => ({
          ...prev,
          [type]: data.recommendations || [],
        }));
      }
    } catch (error) {
      console.error(`Error loading ${type} recommendations:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const refreshRecommendations = async (type: string) => {
    setRecommendations(prev => ({
      ...prev,
      [type]: [],
    }));
    await loadRecommendations(type);
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${(price / 100).toFixed(2)}`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRecommendationReason = (app: App, type: string) => {
    switch (type) {
      case 'personalized':
        if (app.recommendation_score && app.recommendation_score > 0.7) {
          return 'Perfect match for you';
        } else if (app.recommendation_score && app.recommendation_score > 0.5) {
          return 'Great fit based on your activity';
        }
        return 'Recommended for you';

      case 'trending':
        return 'Trending now';

      case 'collaborative':
        if (app.similar_user_purchases && app.similar_user_purchases > 5) {
          return `Loved by ${app.similar_user_purchases} similar users`;
        }
        return 'Popular with similar users';

      case 'category':
        return `Popular in ${app.category}`;

      case 'similar':
        return 'Similar to this app';

      default:
        return 'Recommended';
    }
  };

  const AppCard = ({ app, type }: { app: App; type: string }) => (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {app.icon_url && (
            <div className="flex-shrink-0">
              <Image
                src={app.icon_url}
                alt={app.name}
                width={48}
                height={48}
                className="rounded-lg"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{app.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {app.developer_name}
                  {app.developer_verified && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      ✓
                    </Badge>
                  )}
                </p>
              </div>
              
              <div className="text-right flex-shrink-0">
                <div className="font-semibold text-sm">{formatPrice(app.price)}</div>
                {app.rating_average > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {renderStars(app.rating_average)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({app.rating_count})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {app.short_description}
            </p>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {app.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {getRecommendationReason(app, type)}
                </span>
              </div>

              <Link href={`/marketplace/${app.id}`}>
                <Button size="sm" variant="outline">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            {recommendationTypes.map((type) => {
              const Icon = type.icon;
              return (
                <TabsTrigger
                  key={type.key}
                  value={type.key}
                  className="flex items-center gap-1 text-xs"
                  onClick={() => loadRecommendations(type.key)}
                >
                  <Icon className="w-3 h-3" />
                  {type.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {recommendationTypes.map((type) => (
            <TabsContent key={type.key} value={type.key} className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{type.label}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refreshRecommendations(type.key)}
                    disabled={loading[type.key]}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading[type.key] ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                {loading[type.key] ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <Card key={i} className="h-32">
                        <CardContent className="p-4 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : recommendations[type.key] && recommendations[type.key].length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations[type.key].map((app) => (
                      <AppCard key={app.id} app={app} type={type.key} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Recommendations Yet</h3>
                    <p className="text-muted-foreground">
                      {type.key === 'personalized' 
                        ? 'Purchase some apps to get personalized recommendations!'
                        : 'Check back later for more recommendations.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
