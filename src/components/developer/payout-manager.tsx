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
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
  Download,
  Settings,
  Plus,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface Payout {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  description: string;
  stripe_transfer_id: string | null;
  processed_at: string | null;
  created_at: string;
}

interface PayoutSchedule {
  id: string;
  enabled: boolean;
  frequency: 'weekly' | 'monthly';
  minimum_amount_cents: number;
  day_of_week: number | null;
  day_of_month: number | null;
  next_payout_date: string;
  last_processed_at: string | null;
}

interface PendingEarnings {
  pending_earnings: number;
  pending_purchases: number;
}

export function PayoutManager() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [schedule, setSchedule] = useState<PayoutSchedule | null>(null);
  const [pendingEarnings, setPendingEarnings] = useState<PendingEarnings>({ pending_earnings: 0, pending_purchases: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // Form state
  const [requestAmount, setRequestAmount] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    enabled: false,
    frequency: 'weekly' as 'weekly' | 'monthly',
    minimum_amount_cents: 1000,
    day_of_week: 1,
    day_of_month: 1,
  });

  useEffect(() => {
    loadPayouts();
    loadSchedule();
  }, []);

  const loadPayouts = async () => {
    try {
      const response = await fetch('/api/developer/payouts');
      if (response.ok) {
        const data = await response.json();
        setPayouts(data.payouts || []);
        setPendingEarnings(data.pending_earnings || { pending_earnings: 0, pending_purchases: 0 });
      }
    } catch (error) {
      console.error('Error loading payouts:', error);
      toast.error('Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const loadSchedule = async () => {
    try {
      const response = await fetch('/api/developer/payouts/schedule');
      if (response.ok) {
        const data = await response.json();
        if (data.schedule) {
          setSchedule(data.schedule);
          setScheduleForm({
            enabled: data.schedule.enabled,
            frequency: data.schedule.frequency,
            minimum_amount_cents: data.schedule.minimum_amount_cents,
            day_of_week: data.schedule.day_of_week || 1,
            day_of_month: data.schedule.day_of_month || 1,
          });
        }
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(requestAmount);
    if (!amount || amount < 10) {
      toast.error('Minimum payout amount is $10.00');
      return;
    }

    const amountCents = Math.round(amount * 100);
    if (amountCents > pendingEarnings.pending_earnings) {
      toast.error('Amount exceeds available balance');
      return;
    }

    try {
      const response = await fetch('/api/developer/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: amountCents,
          description: requestDescription,
        }),
      });

      if (response.ok) {
        toast.success('Payout request submitted successfully');
        setShowRequestDialog(false);
        setRequestAmount('');
        setRequestDescription('');
        loadPayouts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to request payout');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error('Failed to request payout');
    }
  };

  const handleUpdateSchedule = async () => {
    try {
      const response = await fetch('/api/developer/payouts/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm),
      });

      if (response.ok) {
        toast.success('Payout schedule updated successfully');
        setShowScheduleDialog(false);
        loadSchedule();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
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
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(pendingEarnings.pending_earnings)}</p>
                <p className="text-xs text-muted-foreground">
                  From {pendingEarnings.pending_purchases} purchases
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Payouts</p>
                <p className="text-2xl font-bold">{payouts.length}</p>
                <p className="text-xs text-muted-foreground">
                  {payouts.filter(p => p.status === 'completed').length} completed
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Next Scheduled</p>
                <p className="text-lg font-bold">
                  {schedule?.enabled && schedule.next_payout_date
                    ? formatDate(schedule.next_payout_date)
                    : 'Not scheduled'
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {schedule?.enabled ? `${schedule.frequency} payouts` : 'Disabled'}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payout Management
            </CardTitle>
            <div className="flex gap-2">
              <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Automatic Payout Schedule</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enabled"
                        checked={scheduleForm.enabled}
                        onCheckedChange={(checked) => 
                          setScheduleForm({ ...scheduleForm, enabled: checked })
                        }
                      />
                      <Label htmlFor="enabled">Enable automatic payouts</Label>
                    </div>

                    {scheduleForm.enabled && (
                      <>
                        <div>
                          <Label htmlFor="frequency">Frequency</Label>
                          <Select
                            value={scheduleForm.frequency}
                            onValueChange={(value: 'weekly' | 'monthly') =>
                              setScheduleForm({ ...scheduleForm, frequency: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="minimum">Minimum Amount ($)</Label>
                          <Input
                            id="minimum"
                            type="number"
                            min="10"
                            step="0.01"
                            value={scheduleForm.minimum_amount_cents / 100}
                            onChange={(e) => 
                              setScheduleForm({ 
                                ...scheduleForm, 
                                minimum_amount_cents: Math.round(parseFloat(e.target.value || '0') * 100)
                              })
                            }
                          />
                        </div>

                        {scheduleForm.frequency === 'weekly' && (
                          <div>
                            <Label htmlFor="dayOfWeek">Day of Week</Label>
                            <Select
                              value={scheduleForm.day_of_week.toString()}
                              onValueChange={(value) =>
                                setScheduleForm({ ...scheduleForm, day_of_week: parseInt(value) })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Monday</SelectItem>
                                <SelectItem value="2">Tuesday</SelectItem>
                                <SelectItem value="3">Wednesday</SelectItem>
                                <SelectItem value="4">Thursday</SelectItem>
                                <SelectItem value="5">Friday</SelectItem>
                                <SelectItem value="6">Saturday</SelectItem>
                                <SelectItem value="7">Sunday</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {scheduleForm.frequency === 'monthly' && (
                          <div>
                            <Label htmlFor="dayOfMonth">Day of Month</Label>
                            <Input
                              id="dayOfMonth"
                              type="number"
                              min="1"
                              max="28"
                              value={scheduleForm.day_of_month}
                              onChange={(e) => 
                                setScheduleForm({ 
                                  ...scheduleForm, 
                                  day_of_month: parseInt(e.target.value || '1')
                                })
                              }
                            />
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowScheduleDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateSchedule}>
                        Save Schedule
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                <DialogTrigger asChild>
                  <Button disabled={pendingEarnings.pending_earnings < 1000}>
                    <Plus className="w-4 h-4 mr-2" />
                    Request Payout
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Payout</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Available balance: {formatCurrency(pendingEarnings.pending_earnings)}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="10"
                        max={pendingEarnings.pending_earnings / 100}
                        step="0.01"
                        value={requestAmount}
                        onChange={(e) => setRequestAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description (optional)</Label>
                      <Input
                        id="description"
                        value={requestDescription}
                        onChange={(e) => setRequestDescription(e.target.value)}
                        placeholder="e.g., Monthly payout"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowRequestDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleRequestPayout}>
                        Request Payout
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Recent Payouts</TabsTrigger>
              <TabsTrigger value="schedule">Schedule Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              {payouts.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Payouts Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Request your first payout when you have earnings available
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payouts.map((payout) => (
                    <Card key={payout.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(payout.status)}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {formatCurrency(payout.amount_cents)}
                                </span>
                                <Badge className={getStatusColor(payout.status)}>
                                  {payout.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {payout.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {formatDate(payout.created_at)}
                            </p>
                            {payout.processed_at && (
                              <p className="text-xs text-muted-foreground">
                                Processed: {formatDate(payout.processed_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="schedule" className="mt-4">
              <div className="space-y-4">
                {schedule ? (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">
                            {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} Payouts
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Minimum: {formatCurrency(schedule.minimum_amount_cents)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Next: {formatDate(schedule.next_payout_date)}
                          </p>
                        </div>
                        <Badge variant={schedule.enabled ? "default" : "secondary"}>
                          {schedule.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Schedule Set</h3>
                    <p className="text-muted-foreground mb-4">
                      Set up automatic payouts to receive your earnings regularly
                    </p>
                    <Button onClick={() => setShowScheduleDialog(true)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Set Up Schedule
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
