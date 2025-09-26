'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  BarChart3,
  LineChart,
  PieChart,
  Table,
  Target,
  Calendar,
  Filter,
  Plus,
  Trash2,
  Save,
  Play,
  Settings,
  Mail,
  Clock,
  DragHandleDots2Icon as Grip
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';

interface ReportBuilderProps {
  onSave?: (report: any) => void;
  initialReport?: any;
  className?: string;
}

const AVAILABLE_METRICS = [
  { id: 'sales_count', label: 'Sales Count', description: 'Total number of sales' },
  { id: 'revenue', label: 'Revenue', description: 'Total revenue generated' },
  { id: 'unique_buyers', label: 'Unique Buyers', description: 'Number of unique customers' },
  { id: 'avg_order_value', label: 'Average Order Value', description: 'Average purchase amount' },
  { id: 'downloads', label: 'Downloads', description: 'Total app downloads' },
  { id: 'rating_average', label: 'Average Rating', description: 'Average app rating' },
  { id: 'active_users', label: 'Active Users', description: 'Number of active users' },
  { id: 'new_users', label: 'New Users', description: 'Number of new registrations' },
  { id: 'conversion_rate', label: 'Conversion Rate', description: 'Purchase conversion rate' },
];

const CHART_TYPES = [
  { id: 'line', label: 'Line Chart', icon: LineChart, description: 'Show trends over time' },
  { id: 'bar', label: 'Bar Chart', icon: BarChart3, description: 'Compare values across categories' },
  { id: 'pie', label: 'Pie Chart', icon: PieChart, description: 'Show proportions of a whole' },
  { id: 'table', label: 'Table', icon: Table, description: 'Display raw data in rows and columns' },
  { id: 'metric', label: 'Metric Card', icon: Target, description: 'Show single key metrics' },
];

const GROUP_BY_OPTIONS = [
  { id: 'date', label: 'Date', description: 'Group by day' },
  { id: 'week', label: 'Week', description: 'Group by week' },
  { id: 'month', label: 'Month', description: 'Group by month' },
  { id: 'category', label: 'Category', description: 'Group by app category' },
  { id: 'platform', label: 'Platform', description: 'Group by platform' },
];

export function ReportBuilder({ onSave, initialReport, className }: ReportBuilderProps) {
  const [reportName, setReportName] = useState(initialReport?.name || '');
  const [reportDescription, setReportDescription] = useState(initialReport?.description || '');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(initialReport?.config?.metrics || []);
  const [chartType, setChartType] = useState(initialReport?.config?.chartType || 'line');
  const [groupBy, setGroupBy] = useState<string[]>(initialReport?.config?.groupBy || []);
  const [filters, setFilters] = useState<any[]>(initialReport?.config?.filters || []);
  const [dateRange, setDateRange] = useState({
    start: initialReport?.config?.dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: initialReport?.config?.dateRange?.end || new Date().toISOString().split('T')[0],
    preset: initialReport?.config?.dateRange?.preset || 'last_30_days',
  });
  const [schedule, setSchedule] = useState({
    enabled: initialReport?.config?.schedule?.enabled || false,
    frequency: initialReport?.config?.schedule?.frequency || 'weekly',
    recipients: initialReport?.config?.schedule?.recipients || [],
  });

  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const handleGroupByToggle = (groupId: string) => {
    setGroupBy(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const addFilter = () => {
    setFilters(prev => [...prev, {
      id: Date.now().toString(),
      field: 'category',
      operator: 'equals',
      value: '',
    }]);
  };

  const updateFilter = (filterId: string, updates: any) => {
    setFilters(prev => prev.map(filter => 
      filter.id === filterId ? { ...filter, ...updates } : filter
    ));
  };

  const removeFilter = (filterId: string) => {
    setFilters(prev => prev.filter(filter => filter.id !== filterId));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(selectedMetrics);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedMetrics(items);
  };

  const generatePreview = async () => {
    if (selectedMetrics.length === 0) {
      toast.error('Please select at least one metric');
      return;
    }

    try {
      setLoading(true);
      
      const config = {
        metrics: selectedMetrics,
        filters,
        groupBy,
        dateRange,
        chartType,
      };

      const response = await fetch('/api/reports/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Preview Report',
          config,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data.report.data);
        setShowPreview(true);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async () => {
    if (!reportName.trim()) {
      toast.error('Please enter a report name');
      return;
    }

    if (selectedMetrics.length === 0) {
      toast.error('Please select at least one metric');
      return;
    }

    try {
      setLoading(true);

      const config = {
        metrics: selectedMetrics,
        filters,
        groupBy,
        dateRange,
        chartType,
        schedule,
      };

      const response = await fetch('/api/reports/custom', {
        method: initialReport ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: initialReport?.id,
          name: reportName,
          description: reportDescription,
          config,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(initialReport ? 'Report updated successfully' : 'Report created successfully');
        
        if (onSave) {
          onSave(data.report);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save report');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  const updateDatePreset = (preset: string) => {
    const now = new Date();
    let start = new Date();

    switch (preset) {
      case 'last_7_days':
        start.setDate(now.getDate() - 7);
        break;
      case 'last_30_days':
        start.setDate(now.getDate() - 30);
        break;
      case 'last_90_days':
        start.setDate(now.getDate() - 90);
        break;
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        now.setDate(0); // Last day of previous month
        break;
      default:
        return;
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
      preset,
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Report Builder</h2>
          <p className="text-muted-foreground">Create custom reports with drag-and-drop interface</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={generatePreview} disabled={loading}>
            <Play className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={saveReport} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            Save Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Report Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="report_name">Report Name</Label>
                <Input
                  id="report_name"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Enter report name..."
                />
              </div>
              <div>
                <Label htmlFor="report_description">Description (Optional)</Label>
                <Textarea
                  id="report_description"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe what this report shows..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Metrics Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AVAILABLE_METRICS.map((metric) => (
                  <div
                    key={metric.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedMetrics.includes(metric.id) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleMetricToggle(metric.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={selectedMetrics.includes(metric.id)}
                        onChange={() => handleMetricToggle(metric.id)}
                      />
                      <div>
                        <p className="font-medium">{metric.label}</p>
                        <p className="text-sm text-muted-foreground">{metric.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Metrics Order */}
              {selectedMetrics.length > 0 && (
                <div className="mt-4">
                  <Label>Metric Order (Drag to reorder)</Label>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="metrics">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 mt-2">
                          {selectedMetrics.map((metricId, index) => {
                            const metric = AVAILABLE_METRICS.find(m => m.id === metricId);
                            return (
                              <Draggable key={metricId} draggableId={metricId} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="flex items-center gap-2 p-2 border rounded bg-white"
                                  >
                                    <Grip className="w-4 h-4 text-muted-foreground" />
                                    <span className="flex-1">{metric?.label}</span>
                                    <Badge variant="outline">{index + 1}</Badge>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart Type */}
          <Card>
            <CardHeader>
              <CardTitle>Chart Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CHART_TYPES.map((chart) => {
                  const Icon = chart.icon;
                  return (
                    <div
                      key={chart.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors text-center ${
                        chartType === chart.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setChartType(chart.id)}
                    >
                      <Icon className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-medium">{chart.label}</p>
                      <p className="text-xs text-muted-foreground">{chart.description}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Group By */}
          <Card>
            <CardHeader>
              <CardTitle>Group By</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {GROUP_BY_OPTIONS.map((option) => (
                  <div
                    key={option.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      groupBy.includes(option.id) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleGroupByToggle(option.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={groupBy.includes(option.id)}
                        onChange={() => handleGroupByToggle(option.id)}
                      />
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Date Range */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Date Range
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Quick Select</Label>
                <Select value={dateRange.preset} onValueChange={updateDatePreset}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_7_days">Last 7 days</SelectItem>
                    <SelectItem value="last_30_days">Last 30 days</SelectItem>
                    <SelectItem value="last_90_days">Last 90 days</SelectItem>
                    <SelectItem value="this_month">This month</SelectItem>
                    <SelectItem value="last_month">Last month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value, preset: 'custom' }))}
                />
              </div>
              
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value, preset: 'custom' }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </div>
                <Button size="sm" variant="outline" onClick={addFilter}>
                  <Plus className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filters.length === 0 ? (
                <p className="text-sm text-muted-foreground">No filters applied</p>
              ) : (
                <div className="space-y-3">
                  {filters.map((filter) => (
                    <div key={filter.id} className="flex items-center gap-2">
                      <Select 
                        value={filter.field} 
                        onValueChange={(value) => updateFilter(filter.id, { field: value })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="category">Category</SelectItem>
                          <SelectItem value="platform">Platform</SelectItem>
                          <SelectItem value="price_min">Min Price</SelectItem>
                          <SelectItem value="price_max">Max Price</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Input
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                        placeholder="Value..."
                        className="flex-1"
                      />
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => removeFilter(filter.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Schedule (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="schedule_enabled"
                  checked={schedule.enabled}
                  onCheckedChange={(checked) => setSchedule(prev => ({ ...prev, enabled: !!checked }))}
                />
                <Label htmlFor="schedule_enabled">Enable scheduled delivery</Label>
              </div>

              {schedule.enabled && (
                <>
                  <div>
                    <Label>Frequency</Label>
                    <Select 
                      value={schedule.frequency} 
                      onValueChange={(value) => setSchedule(prev => ({ ...prev, frequency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="recipients">Email Recipients</Label>
                    <Textarea
                      id="recipients"
                      value={schedule.recipients.join(', ')}
                      onChange={(e) => setSchedule(prev => ({ 
                        ...prev, 
                        recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                      }))}
                      placeholder="Enter email addresses separated by commas..."
                      rows={3}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Report Preview</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-auto">
            {previewData ? (
              <pre className="text-sm bg-muted p-4 rounded">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            ) : (
              <p>No preview data available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
