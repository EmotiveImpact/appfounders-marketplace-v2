'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare,
  Plus,
  Eye,
  Clock,
  User,
  Tag,
  TrendingUp,
  MessageCircle,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Forum {
  id: string;
  title: string;
  content: string;
  category: string;
  author_name: string;
  author_avatar: string;
  author_role: string;
  view_count: number;
  reply_count: number;
  last_reply_at: string | null;
  last_reply_author: string | null;
  created_at: string;
  app_name?: string;
  tags: string[];
}

interface Category {
  category: string;
  forum_count: number;
  total_replies: number;
}

const FORUM_CATEGORIES = [
  { value: 'general', label: 'General Discussion', description: 'General topics and conversations' },
  { value: 'feature-requests', label: 'Feature Requests', description: 'Suggest new features for apps' },
  { value: 'bug-reports', label: 'Bug Reports', description: 'Report issues and bugs' },
  { value: 'app-showcase', label: 'App Showcase', description: 'Show off your apps' },
  { value: 'developer-help', label: 'Developer Help', description: 'Get help with development' },
  { value: 'tester-feedback', label: 'Tester Feedback', description: 'Feedback from beta testers' },
  { value: 'announcements', label: 'Announcements', description: 'Official announcements' },
  { value: 'marketplace-discussion', label: 'Marketplace', description: 'Discuss the marketplace' },
];

export function ForumList() {
  const [forums, setForums] = useState<Forum[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
  });

  useEffect(() => {
    loadForums();
  }, [selectedCategory, sortBy]);

  const loadForums = async () => {
    try {
      const params = new URLSearchParams({
        sort: sortBy,
      });

      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }

      const response = await fetch(`/api/community/forums?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setForums(data.forums || []);
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error loading forums:', error);
      toast.error('Failed to load forums');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForum = async () => {
    if (!formData.title || !formData.content || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/community/forums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        toast.success('Forum thread created successfully');
        setShowCreateDialog(false);
        setFormData({ title: '', content: '', category: '', tags: '' });
        loadForums();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create forum thread');
      }
    } catch (error) {
      console.error('Error creating forum:', error);
      toast.error('Failed to create forum thread');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryInfo = (categoryValue: string) => {
    return FORUM_CATEGORIES.find(cat => cat.value === categoryValue) || 
           { label: categoryValue, description: '' };
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

  const filteredForums = forums.filter(forum =>
    searchQuery === '' ||
    forum.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    forum.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Community Forums</h1>
          <p className="text-muted-foreground">
            Connect with developers and testers, share ideas, and get help
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Thread
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Forum Thread</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter thread title"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORUM_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div>
                          <div className="font-medium">{category.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {category.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your post content..."
                  rows={6}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (optional)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Enter tags separated by commas"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateForum}>
                  Create Thread
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search forums..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {FORUM_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.slice(0, 8).map((category) => {
          const categoryInfo = getCategoryInfo(category.category);
          return (
            <Card 
              key={category.category}
              className={`cursor-pointer transition-colors ${
                selectedCategory === category.category ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedCategory(category.category)}
            >
              <CardContent className="p-4">
                <div className="text-sm font-medium">{categoryInfo.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {category.forum_count} threads, {category.total_replies} replies
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Forum List */}
      <div className="space-y-4">
        {filteredForums.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Forums Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'No forums match your search criteria'
                  : 'Be the first to start a discussion in this category'
                }
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Thread
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredForums.map((forum) => (
            <Card key={forum.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Link 
                        href={`/community/forums/${forum.id}`}
                        className="text-lg font-semibold hover:text-primary transition-colors"
                      >
                        {forum.title}
                      </Link>
                      <Badge variant="secondary">
                        {getCategoryInfo(forum.category).label}
                      </Badge>
                      {forum.app_name && (
                        <Badge variant="outline">
                          {forum.app_name}
                        </Badge>
                      )}
                    </div>

                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {forum.content}
                    </p>

                    {forum.tags && forum.tags.length > 0 && (
                      <div className="flex items-center gap-1 mb-3">
                        <Tag className="w-3 h-3 text-muted-foreground" />
                        {forum.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{forum.author_name}</span>
                        <Badge className={`text-xs ${getRoleColor(forum.author_role)}`}>
                          {forum.author_role}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(forum.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{forum.view_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{forum.reply_count}</span>
                      </div>
                    </div>

                    {forum.last_reply_at && (
                      <div className="text-xs text-muted-foreground">
                        Last reply by {forum.last_reply_author}
                        <br />
                        {formatDate(forum.last_reply_at)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
