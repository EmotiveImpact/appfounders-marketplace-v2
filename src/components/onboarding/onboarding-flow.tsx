'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  User, 
  Building, 
  Globe, 
  Code, 
  TestTube,
  Shield,
  Sparkles,
  Upload,
  Camera,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/upload/image-upload';

interface OnboardingFlowProps {
  userRole: 'developer' | 'tester';
  userId: string;
  initialData?: Partial<OnboardingData>;
  onComplete?: (data: OnboardingData) => void;
}

interface OnboardingData {
  // Profile Information
  name: string;
  bio: string;
  avatar_url?: string;
  
  // Professional Information
  company?: string;
  website?: string;
  location?: string;
  experience_level: 'beginner' | 'intermediate' | 'expert';
  
  // Role-specific Information
  specializations: string[];
  interests: string[];
  
  // Platform Preferences
  notification_preferences: {
    email_notifications: boolean;
    app_updates: boolean;
    marketing_emails: boolean;
    security_alerts: boolean;
  };
  
  // Onboarding Status
  completed_steps: string[];
  onboarding_completed: boolean;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', description: 'Get started with AppFounders' },
  { id: 'profile', title: 'Profile', description: 'Tell us about yourself' },
  { id: 'professional', title: 'Professional', description: 'Your work and experience' },
  { id: 'specialization', title: 'Specialization', description: 'Your skills and interests' },
  { id: 'preferences', title: 'Preferences', description: 'Customize your experience' },
  { id: 'complete', title: 'Complete', description: 'You\'re all set!' },
];

const DEVELOPER_SPECIALIZATIONS = [
  'Web Development', 'Mobile Development', 'Desktop Applications', 'Game Development',
  'AI/ML', 'DevOps', 'Backend Development', 'Frontend Development', 'Full Stack',
  'Data Science', 'Blockchain', 'IoT', 'AR/VR', 'API Development'
];

const TESTER_SPECIALIZATIONS = [
  'Manual Testing', 'Automated Testing', 'Performance Testing', 'Security Testing',
  'Mobile Testing', 'Web Testing', 'API Testing', 'Usability Testing',
  'Accessibility Testing', 'Load Testing', 'Regression Testing', 'Exploratory Testing'
];

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner (0-2 years)', description: 'New to the field' },
  { value: 'intermediate', label: 'Intermediate (2-5 years)', description: 'Some experience' },
  { value: 'expert', label: 'Expert (5+ years)', description: 'Highly experienced' },
];

export function OnboardingFlow({ userRole, userId, initialData, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    bio: '',
    experience_level: 'intermediate',
    specializations: [],
    interests: [],
    notification_preferences: {
      email_notifications: true,
      app_updates: true,
      marketing_emails: false,
      security_alerts: true,
    },
    completed_steps: [],
    onboarding_completed: false,
    ...initialData,
  });

  const router = useRouter();

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      updateData({
        completed_steps: [...data.completed_steps, STEPS[currentStep].id]
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          onboarding_completed: true,
          completed_steps: [...data.completed_steps, 'complete'],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete onboarding');
      }

      toast.success('Welcome to AppFounders! Your profile has been set up.');
      onComplete?.(data);
      
      // Redirect to appropriate dashboard
      router.push(`/dashboard/${userRole}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgress = () => {
    return ((currentStep + 1) / STEPS.length) * 100;
  };

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
      </div>
      
      <div>
        <h2 className="text-3xl font-bold mb-4">
          Welcome to AppFounders!
        </h2>
        <p className="text-lg text-muted-foreground mb-6">
          {userRole === 'developer' 
            ? "Let's set up your developer profile and get you ready to showcase your amazing apps."
            : "Let's set up your tester profile and get you ready to discover and test incredible apps."
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="p-4 border rounded-lg">
          <div className="flex justify-center mb-2">
            {userRole === 'developer' ? <Code className="w-6 h-6 text-blue-500" /> : <TestTube className="w-6 h-6 text-green-500" />}
          </div>
          <h3 className="font-medium mb-1">
            {userRole === 'developer' ? 'Showcase Your Apps' : 'Test Amazing Apps'}
          </h3>
          <p className="text-muted-foreground">
            {userRole === 'developer' 
              ? 'Upload and manage your applications'
              : 'Discover and test new applications'
            }
          </p>
        </div>
        
        <div className="p-4 border rounded-lg">
          <div className="flex justify-center mb-2">
            <Shield className="w-6 h-6 text-purple-500" />
          </div>
          <h3 className="font-medium mb-1">Secure Platform</h3>
          <p className="text-muted-foreground">
            Your data and apps are protected with enterprise-grade security
          </p>
        </div>
        
        <div className="p-4 border rounded-lg">
          <div className="flex justify-center mb-2">
            <Globe className="w-6 h-6 text-orange-500" />
          </div>
          <h3 className="font-medium mb-1">Global Community</h3>
          <p className="text-muted-foreground">
            Connect with developers and testers worldwide
          </p>
        </div>
      </div>
    </div>
  );

  const renderProfileStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Tell us about yourself</h2>
        <p className="text-muted-foreground">
          This information will be visible on your public profile
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {data.avatar_url ? (
                <img src={data.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            placeholder="Your full name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={data.bio}
            onChange={(e) => updateData({ bio: e.target.value })}
            placeholder="Tell us a bit about yourself..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            {data.bio.length}/500 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={data.location || ''}
            onChange={(e) => updateData({ location: e.target.value })}
            placeholder="City, Country"
          />
        </div>
      </div>
    </div>
  );

  const renderProfessionalStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Professional Information</h2>
        <p className="text-muted-foreground">
          Help others understand your background and experience
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company/Organization</Label>
          <Input
            id="company"
            value={data.company || ''}
            onChange={(e) => updateData({ company: e.target.value })}
            placeholder="Where do you work?"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website/Portfolio</Label>
          <Input
            id="website"
            type="url"
            value={data.website || ''}
            onChange={(e) => updateData({ website: e.target.value })}
            placeholder="https://your-website.com"
          />
        </div>

        <div className="space-y-2">
          <Label>Experience Level</Label>
          <Select
            value={data.experience_level}
            onValueChange={(value: any) => updateData({ experience_level: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  <div>
                    <div className="font-medium">{level.label}</div>
                    <div className="text-sm text-muted-foreground">{level.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderSpecializationStep = () => {
    const specializations = userRole === 'developer' ? DEVELOPER_SPECIALIZATIONS : TESTER_SPECIALIZATIONS;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Your Specializations</h2>
          <p className="text-muted-foreground">
            Select the areas you specialize in or are interested in
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">
              {userRole === 'developer' ? 'Development Areas' : 'Testing Areas'}
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Choose all that apply
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {specializations.map((spec) => (
                <Button
                  key={spec}
                  variant={data.specializations.includes(spec) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const newSpecs = data.specializations.includes(spec)
                      ? data.specializations.filter(s => s !== spec)
                      : [...data.specializations, spec];
                    updateData({ specializations: newSpecs });
                  }}
                  className="justify-start h-auto py-2 px-3"
                >
                  {spec}
                </Button>
              ))}
            </div>
          </div>

          {data.specializations.length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Great! You've selected {data.specializations.length} specialization{data.specializations.length !== 1 ? 's' : ''}.
                This will help us show you relevant opportunities.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    );
  };

  const renderPreferencesStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Notification Preferences</h2>
        <p className="text-muted-foreground">
          Choose how you'd like to stay updated
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries({
          email_notifications: 'Email notifications for important updates',
          app_updates: 'Notifications about new apps and updates',
          security_alerts: 'Security and account alerts',
          marketing_emails: 'Marketing emails and newsletters',
        }).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">{label}</div>
              <div className="text-sm text-muted-foreground">
                {key === 'security_alerts' && 'Recommended for account security'}
              </div>
            </div>
            <Button
              variant={data.notification_preferences[key as keyof typeof data.notification_preferences] ? "default" : "outline"}
              size="sm"
              onClick={() => {
                updateData({
                  notification_preferences: {
                    ...data.notification_preferences,
                    [key]: !data.notification_preferences[key as keyof typeof data.notification_preferences],
                  }
                });
              }}
            >
              {data.notification_preferences[key as keyof typeof data.notification_preferences] ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
      </div>
      
      <div>
        <h2 className="text-3xl font-bold mb-4">You're all set!</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Welcome to AppFounders! Your profile has been created and you're ready to get started.
        </p>
      </div>

      <div className="bg-muted p-6 rounded-lg">
        <h3 className="font-semibold mb-4">What's next?</h3>
        <div className="space-y-2 text-sm">
          {userRole === 'developer' ? (
            <>
              <p>• Upload your first app to the marketplace</p>
              <p>• Set up your developer profile and showcase</p>
              <p>• Connect with testers and get feedback</p>
            </>
          ) : (
            <>
              <p>• Browse available apps to test</p>
              <p>• Join testing programs and provide feedback</p>
              <p>• Connect with developers and other testers</p>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return renderWelcomeStep();
      case 'profile':
        return renderProfileStep();
      case 'professional':
        return renderProfessionalStep();
      case 'specialization':
        return renderSpecializationStep();
      case 'preferences':
        return renderPreferencesStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'profile':
        return data.name.trim().length > 0;
      case 'specialization':
        return data.specializations.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Step {currentStep + 1} of {STEPS.length}</span>
                <span>{Math.round(getProgress())}% complete</span>
              </div>
              <Progress value={getProgress()} className="h-2" />
            </div>

            {/* Step Navigation */}
            <div className="flex justify-center">
              <div className="flex space-x-2">
                {STEPS.map((step, index) => (
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
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button
                onClick={completeOnboarding}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    Complete Setup
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
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
