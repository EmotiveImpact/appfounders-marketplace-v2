'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star,
  MapPin,
  Calendar,
  Globe,
  Github,
  Twitter,
  Linkedin,
  Award,
  Download,
  MessageSquare,
  ExternalLink,
  Building,
  Users,
  Clock,
  DollarSign,
  Code,
  Briefcase,
  Trophy,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Developer {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  developer_verified: boolean;
  created_at: string;
  bio: string;
  website: string;
  github_url: string;
  twitter_url: string;
  linkedin_url: string;
  specialties: string[];
  featured: boolean;
  banner_image: string;
  company_name: string;
  company_size: string;
  years_experience: number;
  preferred_technologies: string[];
  availability_status: string;
  hourly_rate: number;
  portfolio_items: any[];
  total_apps: number;
  total_sales: number;
  average_rating: number;
  total_reviews: number;
  total_revenue: number;
}

interface App {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  price: number;
  average_rating: number;
  review_count: number;
  purchase_count: number;
  created_at: string;
}

interface Achievement {
  id: string;
  achievement_type: string;
  title: string;
  description: string;
  icon: string;
  badge_color: string;
  earned_at: string;
  metadata: any;
}

interface Contribution {
  type: string;
  title: string;
  created_at: string;
  engagement: number;
}

interface ShowcaseProfileProps {
  developerId: string;
}

export function ShowcaseProfile({ developerId }: ShowcaseProfileProps) {
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeveloperProfile();
  }, [developerId]);

  const loadDeveloperProfile = async () => {
    try {
      const response = await fetch(`/api/developers/showcase?developer_id=${developerId}`);
      if (response.ok) {
        const data = await response.json();
        setDeveloper(data.developer);
        setApps(data.apps || []);
        setAchievements(data.achievements || []);
        setContributions(data.contributions || []);
      }
    } catch (error) {
      console.error('Error loading developer profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAchievementColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800',
      purple: 'bg-purple-100 text-purple-800',
      orange: 'bg-orange-100 text-orange-800',
    };
    return colors[color as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!developer) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <h3 className="text-lg font-medium mb-2">Developer Not Found</h3>
          <p className="text-muted-foreground">
            The developer profile you're looking for doesn't exist.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <div className="relative">
          {developer.banner_image && (
            <div 
              className="h-48 bg-cover bg-center rounded-t-lg"
              style={{ backgroundImage: `url(${developer.banner_image})` }}
            />
          )}
          <div className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24 border-4 border-white -mt-12 relative z-10">
                <AvatarImage src={developer.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {developer.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{developer.name}</h1>
                  {developer.developer_verified && (
                    <Badge className="bg-blue-100 text-blue-800">
                      <Award className="w-3 h-3 mr-1" />
                      Verified Developer
                    </Badge>
                  )}
                  {developer.featured && (
                    <Badge className="bg-purple-100 text-purple-800">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  <Badge className={getAvailabilityColor(developer.availability_status)}>
                    <Clock className="w-3 h-3 mr-1" />
                    {developer.availability_status}
                  </Badge>
                </div>

                {developer.bio && (
                  <p className="text-muted-foreground mb-4">{developer.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  {developer.company_name && (
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      <span>{developer.company_name}</span>
                      {developer.company_size && (
                        <span className="text-xs">({developer.company_size})</span>
                      )}
                    </div>
                  )}
                  
                  {developer.years_experience && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      <span>{developer.years_experience} years experience</span>
                    </div>
                  )}

                  {developer.hourly_rate && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{formatCurrency(developer.hourly_rate)}/hour</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDistanceToNow(new Date(developer.created_at))} ago</span>
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex gap-2">
                  {developer.website && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={developer.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-4 h-4 mr-1" />
                        Website
                      </a>
                    </Button>
                  )}
                  
                  {developer.github_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={developer.github_url} target="_blank" rel="noopener noreferrer">
                        <Github className="w-4 h-4 mr-1" />
                        GitHub
                      </a>
                    </Button>
                  )}
                  
                  {developer.twitter_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={developer.twitter_url} target="_blank" rel="noopener noreferrer">
                        <Twitter className="w-4 h-4 mr-1" />
                        Twitter
                      </a>
                    </Button>
                  )}
                  
                  {developer.linkedin_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={developer.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="w-4 h-4 mr-1" />
                        LinkedIn
                      </a>
                    </Button>
                  )}

                  <Button size="sm">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{developer.total_apps}</div>
            <div className="text-sm text-muted-foreground">Apps Published</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{developer.total_sales}</div>
            <div className="text-sm text-muted-foreground">Total Sales</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-yellow-600">
              <Star className="w-5 h-5 fill-current" />
              {developer.average_rating.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{developer.total_reviews}</div>
            <div className="text-sm text-muted-foreground">Reviews</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(developer.total_revenue)}
            </div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </CardContent>
        </Card>
      </div>

      {/* Specialties and Technologies */}
      {(developer.specialties?.length > 0 || developer.preferred_technologies?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Skills & Technologies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {developer.specialties?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {developer.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {developer.preferred_technologies?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Preferred Technologies</h4>
                <div className="flex flex-wrap gap-2">
                  {developer.preferred_technologies.map((tech, index) => (
                    <Badge key={index} variant="outline">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs Section */}
      <Tabs defaultValue="apps" className="space-y-4">
        <TabsList>
          <TabsTrigger value="apps">Apps ({apps.length})</TabsTrigger>
          <TabsTrigger value="achievements">Achievements ({achievements.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity ({contributions.length})</TabsTrigger>
          {developer.portfolio_items?.length > 0 && (
            <TabsTrigger value="portfolio">Portfolio ({developer.portfolio_items.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="apps">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.map((app) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {app.icon_url && (
                      <img 
                        src={app.icon_url} 
                        alt={app.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{app.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {app.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current text-yellow-500" />
                            <span>{app.average_rating.toFixed(1)}</span>
                          </div>
                          <span className="text-muted-foreground">
                            ({app.review_count} reviews)
                          </span>
                        </div>
                        <div className="font-medium">
                          {formatCurrency(app.price)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {app.purchase_count} sales
                        </span>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/apps/${app.id}`}>
                            View App
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getAchievementColor(achievement.badge_color)}`}>
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        Earned {formatDistanceToNow(new Date(achievement.earned_at))} ago
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="space-y-4">
            {contributions.map((contribution, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{contribution.title}</h3>
                      <span className="text-sm text-muted-foreground capitalize">
                        {contribution.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(contribution.created_at))} ago
                      </div>
                      {contribution.engagement > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {contribution.engagement} replies
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {developer.portfolio_items?.length > 0 && (
          <TabsContent value="portfolio">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {developer.portfolio_items.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h3 className="font-medium mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {item.description}
                    </p>
                    {item.url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Project
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
