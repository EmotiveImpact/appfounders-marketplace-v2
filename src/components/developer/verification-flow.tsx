'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  FileText, 
  Building, 
  CreditCard,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Globe,
  Phone,
  MapPin,
  Loader2,
  Camera,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { DocumentUpload } from '@/components/upload/document-upload';

interface VerificationData {
  // Personal Information
  legal_name: string;
  date_of_birth: string;
  phone_number: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  
  // Business Information
  business_type: 'individual' | 'business';
  business_name?: string;
  business_registration_number?: string;
  business_address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  
  // Tax Information
  tax_id: string;
  tax_id_type: 'ssn' | 'ein' | 'itin' | 'other';
  tax_country: string;
  
  // Identity Documents
  identity_document_type: 'passport' | 'drivers_license' | 'national_id';
  identity_document_front?: string;
  identity_document_back?: string;
  
  // Bank Information
  bank_account: {
    account_holder_name: string;
    account_number: string;
    routing_number: string;
    bank_name: string;
    account_type: 'checking' | 'savings';
  };
  
  // Verification Status
  verification_status: 'pending' | 'in_review' | 'verified' | 'rejected';
  submitted_at?: string;
  verified_at?: string;
  rejection_reason?: string;
}

interface VerificationFlowProps {
  userId: string;
  initialData?: Partial<VerificationData>;
  onComplete?: (data: VerificationData) => void;
}

const VERIFICATION_STEPS = [
  { id: 'personal', title: 'Personal Info', description: 'Basic personal information' },
  { id: 'business', title: 'Business Info', description: 'Business details and registration' },
  { id: 'tax', title: 'Tax Information', description: 'Tax ID and compliance' },
  { id: 'identity', title: 'Identity Verification', description: 'Upload identity documents' },
  { id: 'banking', title: 'Banking Details', description: 'Payment account setup' },
  { id: 'review', title: 'Review & Submit', description: 'Final review and submission' },
];

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'IN', name: 'India' },
];

export function DeveloperVerificationFlow({ userId, initialData, onComplete }: VerificationFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<VerificationData>({
    legal_name: '',
    date_of_birth: '',
    phone_number: '',
    address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
    },
    business_type: 'individual',
    tax_id: '',
    tax_id_type: 'ssn',
    tax_country: 'US',
    identity_document_type: 'drivers_license',
    bank_account: {
      account_holder_name: '',
      account_number: '',
      routing_number: '',
      bank_name: '',
      account_type: 'checking',
    },
    verification_status: 'pending',
    ...initialData,
  });

  const updateData = (updates: Partial<VerificationData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < VERIFICATION_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const submitVerification = async () => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/developer/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          submitted_at: new Date().toISOString(),
          verification_status: 'in_review',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit verification');
      }

      toast.success('Verification submitted successfully! We will review your information within 2-3 business days.');
      onComplete?.(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgress = () => {
    return ((currentStep + 1) / VERIFICATION_STEPS.length) * 100;
  };

  const renderPersonalInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Personal Information</h2>
        <p className="text-muted-foreground">
          Please provide your legal name and contact information as it appears on your government-issued ID.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="legal_name">Legal Full Name *</Label>
          <Input
            id="legal_name"
            value={data.legal_name}
            onChange={(e) => updateData({ legal_name: e.target.value })}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth *</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={data.date_of_birth}
              onChange={(e) => updateData({ date_of_birth: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number *</Label>
            <Input
              id="phone_number"
              type="tel"
              value={data.phone_number}
              onChange={(e) => updateData({ phone_number: e.target.value })}
              placeholder="+1 (555) 123-4567"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Address</h3>
          
          <div className="space-y-2">
            <Label htmlFor="street">Street Address *</Label>
            <Input
              id="street"
              value={data.address.street}
              onChange={(e) => updateData({ 
                address: { ...data.address, street: e.target.value }
              })}
              placeholder="123 Main Street"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={data.address.city}
                onChange={(e) => updateData({ 
                  address: { ...data.address, city: e.target.value }
                })}
                placeholder="New York"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province *</Label>
              <Input
                id="state"
                value={data.address.state}
                onChange={(e) => updateData({ 
                  address: { ...data.address, state: e.target.value }
                })}
                placeholder="NY"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code *</Label>
              <Input
                id="postal_code"
                value={data.address.postal_code}
                onChange={(e) => updateData({ 
                  address: { ...data.address, postal_code: e.target.value }
                })}
                placeholder="10001"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Country *</Label>
            <Select
              value={data.address.country}
              onValueChange={(value) => updateData({ 
                address: { ...data.address, country: value }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBusinessInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Business Information</h2>
        <p className="text-muted-foreground">
          Tell us about your business structure and registration details.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Business Type *</Label>
          <Select
            value={data.business_type}
            onValueChange={(value: 'individual' | 'business') => updateData({ business_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual/Sole Proprietor</SelectItem>
              <SelectItem value="business">Business/Corporation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.business_type === 'business' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                value={data.business_name || ''}
                onChange={(e) => updateData({ business_name: e.target.value })}
                placeholder="Acme Software Inc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_registration_number">Business Registration Number</Label>
              <Input
                id="business_registration_number"
                value={data.business_registration_number || ''}
                onChange={(e) => updateData({ business_registration_number: e.target.value })}
                placeholder="123456789"
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Business Address</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="same_as_personal"
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateData({ business_address: { ...data.address } });
                    }
                  }}
                />
                <Label htmlFor="same_as_personal">Same as personal address</Label>
              </div>
              
              {/* Business address fields would go here - similar to personal address */}
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderTaxInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Tax Information</h2>
        <p className="text-muted-foreground">
          We need your tax information for compliance and payment processing.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Tax ID Type *</Label>
          <Select
            value={data.tax_id_type}
            onValueChange={(value: any) => updateData({ tax_id_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ssn">Social Security Number (SSN)</SelectItem>
              <SelectItem value="ein">Employer Identification Number (EIN)</SelectItem>
              <SelectItem value="itin">Individual Taxpayer Identification Number (ITIN)</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax_id">Tax ID *</Label>
          <Input
            id="tax_id"
            value={data.tax_id}
            onChange={(e) => updateData({ tax_id: e.target.value })}
            placeholder="XXX-XX-XXXX"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Tax Country *</Label>
          <Select
            value={data.tax_country}
            onValueChange={(value) => updateData({ tax_country: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your tax information is encrypted and securely stored. We use this information only for 
            tax reporting and compliance purposes as required by law.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );

  const renderIdentityStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Identity Verification</h2>
        <p className="text-muted-foreground">
          Upload a clear photo of your government-issued ID for identity verification.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Document Type *</Label>
          <Select
            value={data.identity_document_type}
            onValueChange={(value: any) => updateData({ identity_document_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="drivers_license">Driver's License</SelectItem>
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="national_id">National ID Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Front of Document *</Label>
            <DocumentUpload
              category="identity-documents"
              maxFiles={1}
              acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
              onUploadComplete={(files) => {
                if (files.length > 0) {
                  updateData({ identity_document_front: files[0].url });
                }
              }}
            />
          </div>

          {data.identity_document_type !== 'passport' && (
            <div className="space-y-2">
              <Label>Back of Document *</Label>
              <DocumentUpload
                category="identity-documents"
                maxFiles={1}
                acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
                onUploadComplete={(files) => {
                  if (files.length > 0) {
                    updateData({ identity_document_back: files[0].url });
                  }
                }}
              />
            </div>
          )}
        </div>

        <Alert>
          <Camera className="h-4 w-4" />
          <AlertDescription>
            Please ensure your document is clearly visible, well-lit, and all text is readable. 
            Blurry or unclear images may delay the verification process.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );

  const renderBankingStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Banking Information</h2>
        <p className="text-muted-foreground">
          Add your bank account details to receive payments from app sales.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="account_holder_name">Account Holder Name *</Label>
          <Input
            id="account_holder_name"
            value={data.bank_account.account_holder_name}
            onChange={(e) => updateData({ 
              bank_account: { ...data.bank_account, account_holder_name: e.target.value }
            })}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="routing_number">Routing Number *</Label>
            <Input
              id="routing_number"
              value={data.bank_account.routing_number}
              onChange={(e) => updateData({ 
                bank_account: { ...data.bank_account, routing_number: e.target.value }
              })}
              placeholder="123456789"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_number">Account Number *</Label>
            <Input
              id="account_number"
              value={data.bank_account.account_number}
              onChange={(e) => updateData({ 
                bank_account: { ...data.bank_account, account_number: e.target.value }
              })}
              placeholder="1234567890"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bank_name">Bank Name *</Label>
            <Input
              id="bank_name"
              value={data.bank_account.bank_name}
              onChange={(e) => updateData({ 
                bank_account: { ...data.bank_account, bank_name: e.target.value }
              })}
              placeholder="Chase Bank"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Account Type *</Label>
            <Select
              value={data.bank_account.account_type}
              onValueChange={(value: 'checking' | 'savings') => updateData({ 
                bank_account: { ...data.bank_account, account_type: value }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertDescription>
            Your banking information is encrypted and securely stored. We use bank-level security 
            to protect your financial data.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Review & Submit</h2>
        <p className="text-muted-foreground">
          Please review your information before submitting for verification.
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span>{data.legal_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone:</span>
              <span>{data.phone_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address:</span>
              <span>{data.address.street}, {data.address.city}, {data.address.state}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="capitalize">{data.business_type}</span>
            </div>
            {data.business_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business Name:</span>
                <span>{data.business_name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                After submission, our team will review your information within 2-3 business days. 
                You'll receive an email notification once the review is complete.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="flex items-center space-x-2">
          <Checkbox id="terms" required />
          <Label htmlFor="terms" className="text-sm">
            I certify that all information provided is accurate and complete. I understand that 
            providing false information may result in account suspension.
          </Label>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (VERIFICATION_STEPS[currentStep].id) {
      case 'personal':
        return renderPersonalInfoStep();
      case 'business':
        return renderBusinessInfoStep();
      case 'tax':
        return renderTaxInfoStep();
      case 'identity':
        return renderIdentityStep();
      case 'banking':
        return renderBankingStep();
      case 'review':
        return renderReviewStep();
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (VERIFICATION_STEPS[currentStep].id) {
      case 'personal':
        return data.legal_name && data.date_of_birth && data.phone_number && 
               data.address.street && data.address.city && data.address.state;
      case 'business':
        return data.business_type === 'individual' || 
               (data.business_type === 'business' && data.business_name);
      case 'tax':
        return data.tax_id && data.tax_id_type && data.tax_country;
      case 'identity':
        return data.identity_document_front && 
               (data.identity_document_type === 'passport' || data.identity_document_back);
      case 'banking':
        return data.bank_account.account_holder_name && data.bank_account.routing_number && 
               data.bank_account.account_number && data.bank_account.bank_name;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Step {currentStep + 1} of {VERIFICATION_STEPS.length}</span>
                <span>{Math.round(getProgress())}% complete</span>
              </div>
              <Progress value={getProgress()} className="h-2" />
            </div>

            {/* Step Navigation */}
            <div className="flex justify-center">
              <div className="flex space-x-2">
                {VERIFICATION_STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={`w-3 h-3 rounded-full ${
                      index <= currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {renderCurrentStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            {currentStep === VERIFICATION_STEPS.length - 1 ? (
              <Button
                onClick={submitVerification}
                disabled={isSubmitting || !canProceed()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit for Review
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
              >
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
