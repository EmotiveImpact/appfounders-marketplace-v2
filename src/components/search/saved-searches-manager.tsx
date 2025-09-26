'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search,
  Bell,
  BellOff,
  Edit,
  Trash2,
  Plus,
  Play,
  Pause,
  TestTube,
  Eye,
  Calendar,
  Clock,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface SavedSearch {
  id: string;
  name: string;
  search_query: string;
  filters: any;
  alert_enabled: boolean;
  alert_frequency: 'daily' | 'weekly';
  created_at: string;
  updated_at: string;
  alert_count: number;
  last_alert: string | null;
}

interface SearchAlert {
  id: string;
  saved_search_id: string;
  frequency: 'daily' | 'weekly';
  active: boolean;
  last_triggered: string | null;
  next_check: string;
  total_notifications: number;
  search_name: string;
  search_query: string;
  new_results_count: number;
}

export function SavedSearchesManager() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchAlerts, setSearchAlerts] = useState<SearchAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('searches');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    search_query: '',
    filters: {},
    alert_enabled: false,
    alert_frequency: 'daily' as 'daily' | 'weekly',
  });

  useEffect(() => {
    loadSavedSearches();
    loadSearchAlerts();
  }, []);

  const loadSavedSearches = async () => {
    try {
      const response = await fetch('/api/saved-searches');
      if (response.ok) {
        const data = await response.json();
        setSavedSearches(data.searches || []);
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
      toast.error('Failed to load saved searches');
    } finally {
      setLoading(false);
    }
  };

  const loadSearchAlerts = async () => {
    try {
      const response = await fetch('/api/saved-searches/alerts');
      if (response.ok) {
        const data = await response.json();
        setSearchAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error loading search alerts:', error);
    }
  };

  const handleCreateSearch = async () => {
    try {
      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Saved search created successfully');
        setShowCreateDialog(false);
        resetForm();
        loadSavedSearches();
        loadSearchAlerts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create saved search');
      }
    } catch (error) {
      console.error('Error creating saved search:', error);
      toast.error('Failed to create saved search');
    }
  };

  const handleUpdateSearch = async () => {
    if (!editingSearch) return;

    try {
      const response = await fetch('/api/saved-searches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: editingSearch.id }),
      });

      if (response.ok) {
        toast.success('Saved search updated successfully');
        setEditingSearch(null);
        resetForm();
        loadSavedSearches();
        loadSearchAlerts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update saved search');
      }
    } catch (error) {
      console.error('Error updating saved search:', error);
      toast.error('Failed to update saved search');
    }
  };

  const handleDeleteSearch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved search?')) return;

    try {
      const response = await fetch(`/api/saved-searches?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Saved search deleted successfully');
        loadSavedSearches();
        loadSearchAlerts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete saved search');
      }
    } catch (error) {
      console.error('Error deleting saved search:', error);
      toast.error('Failed to delete saved search');
    }
  };

  const handleAlertAction = async (alertId: string, action: string) => {
    try {
      const response = await fetch('/api/saved-searches/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId, action }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        
        if (action === 'test' && data.results_count > 0) {
          toast.info(`Found ${data.results_count} new results for your search`);
        }
        
        loadSearchAlerts();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${action} alert`);
      }
    } catch (error) {
      console.error(`Error ${action} alert:`, error);
      toast.error(`Failed to ${action} alert`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      search_query: '',
      filters: {},
      alert_enabled: false,
      alert_frequency: 'daily',
    });
  };

  const startEdit = (search: SavedSearch) => {
    setEditingSearch(search);
    setFormData({
      name: search.name,
      search_query: search.search_query,
      filters: search.filters || {},
      alert_enabled: search.alert_enabled,
      alert_frequency: search.alert_frequency,
    });
    setShowCreateDialog(true);
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Saved Searches & Alerts
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                New Search
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSearch ? 'Edit Saved Search' : 'Create Saved Search'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Search Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., React Components"
                  />
                </div>
                
                <div>
                  <Label htmlFor="query">Search Query</Label>
                  <Input
                    id="query"
                    value={formData.search_query}
                    onChange={(e) => setFormData({ ...formData, search_query: e.target.value })}
                    placeholder="e.g., react component library"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="alerts"
                    checked={formData.alert_enabled}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, alert_enabled: checked })
                    }
                  />
                  <Label htmlFor="alerts">Enable alerts for new matches</Label>
                </div>

                {formData.alert_enabled && (
                  <div>
                    <Label htmlFor="frequency">Alert Frequency</Label>
                    <Select
                      value={formData.alert_frequency}
                      onValueChange={(value: 'daily' | 'weekly') =>
                        setFormData({ ...formData, alert_frequency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setEditingSearch(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={editingSearch ? handleUpdateSearch : handleCreateSearch}
                  >
                    {editingSearch ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="searches">
              Saved Searches ({savedSearches.length})
            </TabsTrigger>
            <TabsTrigger value="alerts">
              Active Alerts ({searchAlerts.filter(a => a.active).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="searches" className="mt-4">
            {savedSearches.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Saved Searches</h3>
                <p className="text-muted-foreground mb-4">
                  Save your search queries to quickly find apps later
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedSearches.map((search) => (
                  <Card key={search.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{search.name}</h3>
                            {search.alert_enabled && (
                              <Badge variant="secondary" className="text-xs">
                                <Bell className="w-3 h-3 mr-1" />
                                {search.alert_frequency}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            "{search.search_query}"
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Created: {formatDate(search.created_at)}</span>
                            {search.alert_count > 0 && (
                              <span>{search.alert_count} alerts sent</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(search)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSearch(search.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="alerts" className="mt-4">
            {searchAlerts.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Alerts</h3>
                <p className="text-muted-foreground mb-4">
                  Enable alerts on your saved searches to get notified of new matches
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchAlerts.map((alert) => (
                  <Card key={alert.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{alert.search_name}</h3>
                            <Badge variant={alert.active ? "default" : "secondary"}>
                              {alert.active ? 'Active' : 'Paused'}
                            </Badge>
                            {alert.new_results_count > 0 && (
                              <Badge variant="destructive">
                                {alert.new_results_count} new
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            "{alert.search_query}"
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {alert.frequency}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Next: {formatDate(alert.next_check)}
                            </span>
                            <span>{alert.total_notifications} notifications sent</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAlertAction(alert.id, 'test')}
                            title="Test Alert"
                          >
                            <TestTube className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => 
                              handleAlertAction(alert.id, alert.active ? 'pause' : 'resume')
                            }
                            title={alert.active ? 'Pause Alert' : 'Resume Alert'}
                          >
                            {alert.active ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          {alert.new_results_count > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAlertAction(alert.id, 'mark_read')}
                              title="Mark as Read"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
