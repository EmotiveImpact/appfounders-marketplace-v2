'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy,
  Star,
  Gift,
  TrendingUp,
  Award,
  Crown,
  Zap,
  Target,
  Calendar,
  Users,
  Loader2,
  Medal,
  Gem
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface UserPoints {
  total_points: number;
  total_activities: number;
}

interface PointActivity {
  id: string;
  points: number;
  activity_type: string;
  description: string;
  created_at: string;
  metadata: any;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: string;
  earned_at?: string;
  bonus_points?: number;
  criteria?: any;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar_url: string;
  role: string;
  total_points: number;
  badge_count: number;
  rank: number;
}

interface Overview {
  total_points: number;
  badge_count: number;
  weekly_activities: number;
  monthly_activities: number;
}

export function RewardsDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [pointActivities, setPointActivities] = useState<PointActivity[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<{ rank: number | null; total_points: number }>({ rank: null, total_points: 0 });
  const [recentBadges, setRecentBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'points') {
      loadPoints();
    } else if (activeTab === 'badges') {
      loadBadges();
    } else if (activeTab === 'leaderboard') {
      loadLeaderboard();
    }
  }, [activeTab]);

  const loadOverview = async () => {
    try {
      const response = await fetch('/api/community/rewards');
      if (response.ok) {
        const data = await response.json();
        setOverview(data.overview);
        setRecentBadges(data.recent_badges || []);
      }
    } catch (error) {
      console.error('Error loading overview:', error);
      toast.error('Failed to load rewards overview');
    } finally {
      setLoading(false);
    }
  };

  const loadPoints = async () => {
    try {
      const response = await fetch('/api/community/rewards?type=points');
      if (response.ok) {
        const data = await response.json();
        setUserPoints(data.user_points);
        setPointActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error loading points:', error);
      toast.error('Failed to load points data');
    }
  };

  const loadBadges = async () => {
    try {
      const response = await fetch('/api/community/rewards?type=badges');
      if (response.ok) {
        const data = await response.json();
        setEarnedBadges(data.earned_badges || []);
        setAvailableBadges(data.available_badges || []);
      }
    } catch (error) {
      console.error('Error loading badges:', error);
      toast.error('Failed to load badges data');
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await fetch('/api/community/rewards?type=leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
        setUserRank(data.user_rank);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      toast.error('Failed to load leaderboard data');
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return <Medal className="w-4 h-4" />;
      case 'rare':
        return <Star className="w-4 h-4" />;
      case 'epic':
        return <Crown className="w-4 h-4" />;
      case 'legendary':
        return <Gem className="w-4 h-4" />;
      default:
        return <Award className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-purple-100 text-purple-800';
      case 'developer':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatActivityType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Community Rewards</h1>
        <p className="text-muted-foreground">
          Earn points and badges for your contributions to the community
        </p>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">{overview.total_points}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-8 h-8 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-purple-600">{overview.badge_count}</div>
              <div className="text-sm text-muted-foreground">Badges Earned</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{overview.weekly_activities}</div>
              <div className="text-sm text-muted-foreground">This Week</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-600">{overview.monthly_activities}</div>
              <div className="text-sm text-muted-foreground">This Month</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Badges */}
      {recentBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recentBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={`flex-shrink-0 p-3 rounded-lg border-2 ${getRarityColor(badge.rarity)}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getRarityIcon(badge.rarity)}
                    <span className="font-medium text-sm">{badge.name}</span>
                  </div>
                  <p className="text-xs opacity-80">{badge.description}</p>
                  {badge.earned_at && (
                    <p className="text-xs opacity-60 mt-1">
                      {formatDistanceToNow(new Date(badge.earned_at))} ago
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="points">Points</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Progress to Next Level */}
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Level Progress</span>
                      <span>{overview?.total_points || 0} / 1000 points</span>
                    </div>
                    <Progress value={((overview?.total_points || 0) % 1000) / 10} />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Keep contributing to earn more points and unlock new badges!</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Earn More Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">Write a Review</div>
                      <div className="text-sm text-muted-foreground">+50 points</div>
                    </div>
                    <Button size="sm" variant="outline">
                      Start
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">Create Forum Post</div>
                      <div className="text-sm text-muted-foreground">+25 points</div>
                    </div>
                    <Button size="sm" variant="outline">
                      Start
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">Help Another User</div>
                      <div className="text-sm text-muted-foreground">+30 points</div>
                    </div>
                    <Button size="sm" variant="outline">
                      Start
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="points" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Point Activities</CardTitle>
            </CardHeader>
            <CardContent>
              {pointActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No point activities yet</p>
                  <p className="text-sm">Start contributing to earn your first points!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pointActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{activity.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatActivityType(activity.activity_type)} • {formatDistanceToNow(new Date(activity.created_at))} ago
                        </div>
                      </div>
                      <div className={`font-bold ${activity.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {activity.points > 0 ? '+' : ''}{activity.points}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earned Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Earned Badges ({earnedBadges.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {earnedBadges.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No badges earned yet</p>
                    <p className="text-sm">Complete activities to earn your first badge!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {earnedBadges.map((badge) => (
                      <div
                        key={badge.id}
                        className={`p-3 rounded-lg border-2 ${getRarityColor(badge.rarity)}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {getRarityIcon(badge.rarity)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{badge.name}</div>
                            <p className="text-sm opacity-80">{badge.description}</p>
                            {badge.earned_at && (
                              <p className="text-xs opacity-60 mt-1">
                                Earned {formatDistanceToNow(new Date(badge.earned_at))} ago
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Available Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {availableBadges.slice(0, 5).map((badge) => (
                    <div
                      key={badge.id}
                      className="p-3 rounded-lg border border-dashed border-gray-300 opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {getRarityIcon(badge.rarity)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{badge.name}</div>
                          <p className="text-sm">{badge.description}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {badge.rarity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Community Leaderboard
              </CardTitle>
              {userRank.rank && (
                <p className="text-sm text-muted-foreground">
                  Your rank: #{userRank.rank} with {userRank.total_points} points
                </p>
              )}
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No leaderboard data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex-shrink-0 w-8 text-center">
                        {index === 0 && <Crown className="w-6 h-6 text-yellow-500 mx-auto" />}
                        {index === 1 && <Medal className="w-6 h-6 text-gray-400 mx-auto" />}
                        {index === 2 && <Medal className="w-6 h-6 text-orange-500 mx-auto" />}
                        {index > 2 && <span className="font-bold text-lg">#{entry.rank}</span>}
                      </div>
                      
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={entry.avatar_url} />
                        <AvatarFallback>{entry.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{entry.name}</span>
                          <Badge className={`text-xs ${getRoleColor(entry.role)}`}>
                            {entry.role}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.badge_count} badges earned
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-lg">{entry.total_points}</div>
                        <div className="text-sm text-muted-foreground">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
