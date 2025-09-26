'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bookmark,
  Bell,
  BellOff,
  Search,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  Clock,
  Star,
  DollarSign,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface SavedSearch {
  id: string;
  name: string;
  search_criteria: any;
  alert_enabled: boolean;
  alert_frequency: string;
  unread_alerts: number;
  total_alerts: number;
  last_checked_at: string;
  created_at: string;
  recent_alerts?: any[];
}

interface SavedSearchesProps {
  currentSearchCriteria?: any;
  onApplySearch?: (criteria: any) => void;
}

export function SavedSearches({ currentSearchCriteria, onApplySearch }: SavedSearchesProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [newSearchName, setNewSearchName] = useState('');
  const [newAlertFrequency, setNewAlertFrequency] = useState<'immediate' | 'daily' | 'weekly'>('immediate');
  const [newAlertEnabled, setNewAlertEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/saved-searches?include_alerts=true');
      
      if (response.ok) {
        const data = await response.json();
        setSavedSearches(data.saved_searches || []);
      } else {
        toast.error('Failed to load saved searches');
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
      toast.error('Failed to load saved searches');
    } finally {
      setLoading(false);
    }
  };

  const createSavedSearch = async () => {
    if (!newSearchName.trim()) {
      toast.error('Please enter a name for your saved search');
      return;
    }

    if (!currentSearchCriteria || Object.keys(currentSearchCriteria).length === 0) {
      toast.error('No search criteria to save. Please perform a search first.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSearchName.trim(),
          search_criteria: currentSearchCriteria,
          alert_enabled: newAlertEnabled,
          alert_frequency: newAlertFrequency,
        }),
      });

      if (response.ok) {
        toast.success('Saved search created successfully');
        setShowCreateDialog(false);
        setNewSearchName('');
        setNewAlertEnabled(true);
        setNewAlertFrequency('immediate');
        loadSavedSearches();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create saved search');
      }
    } catch (error) {
      console.error('Error creating saved search:', error);
      toast.error('Failed to create saved search');
    } finally {
      setSubmitting(false);
    }
  };

  const updateSavedSearch = async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/saved-searches/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        toast.success('Saved search updated');
        loadSavedSearches();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update saved search');
      }
    } catch (error) {
      console.error('Error updating saved search:', error);
      toast.error('Failed to update saved search');
    }
  };

  const deleteSavedSearch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved search?')) {
      return;
    }

    try {
      const response = await fetch(`/api/saved-searches/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Saved search deleted');
        loadSavedSearches();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete saved search');
      }
    } catch (error) {
      console.error('Error deleting saved search:', error);
      toast.error('Failed to delete saved search');
    }
  };

  const checkForMatches = async (id: string) => {
    try {
      const response = await fetch(`/api/saved-searches/${id}/check`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        loadSavedSearches();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to check for matches');
      }
    } catch (error) {
      console.error('Error checking for matches:', error);
      toast.error('Failed to check for matches');
    }
  };

  const applySavedSearch = (search: SavedSearch) => {
    if (onApplySearch) {
      onApplySearch(search.search_criteria);
      toast.success(`Applied search: ${search.name}`);
    }
  };

  const formatSearchCriteria = (criteria: any) => {
    const parts = [];
    
    if (criteria.query) parts.push(`"${criteria.query}"`);
    if (criteria.category) parts.push(`Category: ${criteria.category}`);
    if (criteria.platform) parts.push(`Platform: ${criteria.platform}`);
    if (criteria.price_min || criteria.price_max) {
      const min = criteria.price_min ? `$${criteria.price_min}` : '$0';
      const max = criteria.price_max ? `$${criteria.price_max}` : '∞';
      parts.push(`Price: ${min} - ${max}`);
    }
    if (criteria.rating_min) parts.push(`Rating: ${criteria.rating_min}+ stars`);
    if (criteria.tags && criteria.tags.length > 0) {
      parts.push(`Tags: ${criteria.tags.join(', ')}`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'No criteria';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="w-5 h-5" />
            Saved Searches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5" />
            Saved Searches
            {savedSearches.length > 0 && (
              <Badge variant="secondary">
                {savedSearches.length}
              </Badge>
            )}
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Save Current Search
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Current Search</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search_name">Search Name</Label>
                  <Input
                    id="search_name"
                    value={newSearchName}
                    onChange={(e) => setNewSearchName(e.target.value)}
                    placeholder="Enter a name for this search..."
                  />
                </div>

                <div>
                  <Label>Current Search Criteria</Label>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    {currentSearchCriteria ? formatSearchCriteria(currentSearchCriteria) : 'No search criteria'}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="alert_enabled"
                    checked={newAlertEnabled}
                    onChange={(e) => setNewAlertEnabled(e.target.checked)}
                  />
                  <Label htmlFor="alert_enabled">Enable alerts for new matches</Label>
                </div>

                {newAlertEnabled && (
                  <div>
                    <Label htmlFor="alert_frequency">Alert Frequency</Label>
                    <Select value={newAlertFrequency} onValueChange={(value: any) => setNewAlertFrequency(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button onClick={createSavedSearch} disabled={submitting} className="flex-1">
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 mr-2" />
                        Save Search
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={submitting}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {savedSearches.length === 0 ? (
          <div className="text-center py-8">
            <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Saved Searches</h3>
            <p className="text-muted-foreground mb-4">
              Save your search criteria to get notified when new matching apps are added.
            </p>
            <Button onClick={() => setShowCreateDialog(true)} disabled={!currentSearchCriteria}>
              <Plus className="w-4 h-4 mr-2" />
              Save Current Search
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{search.name}</h3>
                      {search.alert_enabled ? (
                        <Bell className="w-4 h-4 text-green-600" />
                      ) : (
                        <BellOff className="w-4 h-4 text-muted-foreground" />
                      )}
                      {search.unread_alerts > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {search.unread_alerts} new
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatSearchCriteria(search.search_criteria)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applySavedSearch(search)}
                    >
                      <Search className="w-4 h-4 mr-1" />
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => checkForMatches(search.id)}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateSavedSearch(search.id, { alert_enabled: !search.alert_enabled })}
                    >
                      {search.alert_enabled ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteSavedSearch(search.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last checked: {formatDate(search.last_checked_at)}
                    </span>
                    {search.alert_enabled && (
                      <span>Alerts: {search.alert_frequency}</span>
                    )}
                  </div>
                  <span>
                    {search.total_alerts} total alert{search.total_alerts === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
