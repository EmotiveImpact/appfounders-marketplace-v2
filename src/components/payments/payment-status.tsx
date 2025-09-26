'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2, 
  CreditCard,
  RefreshCw 
} from 'lucide-react';
import { formatCurrency } from '@/lib/stripe/config';

interface PaymentStatusProps {
  paymentIntentId: string;
  onStatusChange?: (status: string) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface PaymentDetails {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description?: string;
  last_payment_error?: {
    message: string;
    code?: string;
  };
}

export function PaymentStatus({
  paymentIntentId,
  onStatusChange,
  autoRefresh = true,
  refreshInterval = 3000,
}: PaymentStatusProps) {
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/payments/status/${paymentIntentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment status');
      }

      setPayment(data);
      onStatusChange?.(data.status);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentStatus();

    if (autoRefresh) {
      const interval = setInterval(() => {
        // Only refresh if payment is still pending
        if (payment?.status === 'requires_payment_method' || 
            payment?.status === 'requires_confirmation' ||
            payment?.status === 'processing') {
          fetchPaymentStatus();
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [paymentIntentId, autoRefresh, refreshInterval, payment?.status]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
      case 'canceled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'requires_payment_method':
      case 'requires_confirmation':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'requires_payment_method':
      case 'requires_confirmation':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'Payment Successful';
      case 'failed':
        return 'Payment Failed';
      case 'canceled':
        return 'Payment Canceled';
      case 'processing':
        return 'Processing Payment';
      case 'requires_payment_method':
        return 'Awaiting Payment Method';
      case 'requires_confirmation':
        return 'Awaiting Confirmation';
      default:
        return 'Unknown Status';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading payment status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!payment) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">No payment information available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getStatusIcon(payment.status)}
            Payment Status
          </span>
          <Badge className={getStatusColor(payment.status)}>
            {getStatusText(payment.status)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Amount:</span>
            <p className="font-medium">
              {formatCurrency(payment.amount, payment.currency)}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Payment ID:</span>
            <p className="font-mono text-xs">{payment.id}</p>
          </div>
          <div>
            <span className="text-gray-600">Created:</span>
            <p>{new Date(payment.created * 1000).toLocaleString()}</p>
          </div>
          {payment.description && (
            <div>
              <span className="text-gray-600">Description:</span>
              <p>{payment.description}</p>
            </div>
          )}
        </div>

        {payment.last_payment_error && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Payment Error:</strong> {payment.last_payment_error.message}
              {payment.last_payment_error.code && (
                <span className="block text-xs mt-1">
                  Error Code: {payment.last_payment_error.code}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {(payment.status === 'processing' || 
          payment.status === 'requires_confirmation') && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Checking payment status...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
