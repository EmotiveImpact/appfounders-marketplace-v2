'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Shield,
  Smartphone,
  Globe,
  FileText,
  Users,
  Star,
  Zap,
  Lock,
  Eye,
  Download,
  MessageSquare
} from 'lucide-react';

export function AppQualityGuidelines() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            AppFounders Quality Guidelines
          </CardTitle>
          <p className="text-muted-foreground">
            Comprehensive standards for app submission and approval to ensure the highest quality marketplace experience.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="review">Review Process</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Quality Standards Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                AppFounders maintains strict quality standards to ensure our marketplace offers only the best applications 
                to our community. All submissions are reviewed against these comprehensive guidelines.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    What We Look For
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      High-quality, functional applications
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Clear, accurate descriptions and metadata
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Professional presentation and branding
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Comprehensive documentation and support
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Responsive developer communication
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-red-700 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Automatic Rejections
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      Broken, non-functional applications
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      Malicious or harmful software
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      Copyright or trademark violations
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      Misleading or false information
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      Inappropriate or offensive content
                    </li>
                  </ul>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> All apps must provide genuine value to users. Simple wrappers, 
                  basic templates, or low-effort applications will be rejected.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Technical Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Functionality Standards</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2">Required</Badge>
                    <ul className="space-y-1 text-sm">
                      <li>• App must launch and run without crashes</li>
                      <li>• All advertised features must work correctly</li>
                      <li>• Responsive design for target platforms</li>
                      <li>• Reasonable loading times (&lt;5 seconds)</li>
                      <li>• Proper error handling and user feedback</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2">Recommended</Badge>
                    <ul className="space-y-1 text-sm">
                      <li>• Offline functionality where applicable</li>
                      <li>• Progressive web app features</li>
                      <li>• Accessibility compliance (WCAG 2.1)</li>
                      <li>• Performance optimization</li>
                      <li>• Cross-browser compatibility</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Platform-Specific Requirements</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Web Applications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p>• HTTPS required</p>
                      <p>• Mobile responsive</p>
                      <p>• Modern browser support</p>
                      <p>• Valid HTML/CSS</p>
                      <p>• SEO optimization</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Mobile Apps
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p>• Platform guidelines compliance</p>
                      <p>• Proper permissions handling</p>
                      <p>• Battery optimization</p>
                      <p>• App store requirements</p>
                      <p>• Device compatibility</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Desktop Apps
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p>• Clean installation/uninstallation</p>
                      <p>• System requirements clearly stated</p>
                      <p>• No bundled malware</p>
                      <p>• Proper file associations</p>
                      <p>• OS-specific conventions</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Apps that crash during review, have broken core functionality, or fail to meet minimum 
                  technical standards will be automatically rejected.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Content & Presentation Standards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">App Metadata Requirements</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h5 className="font-medium text-green-700">Required Elements</h5>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Clear, descriptive app name (no special characters)
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Comprehensive description (minimum 100 words)
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Accurate category selection
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Relevant tags (3-10 recommended)
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Feature list highlighting key capabilities
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium text-blue-700">Visual Assets</h5>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        High-quality app icon (512x512px minimum)
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        Screenshots showing key features (3-6 images)
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        Professional, consistent visual design
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        No watermarks or placeholder images
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        Accurate representation of actual app
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Content Guidelines</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Badge className="bg-green-100 text-green-800">Acceptable Content</Badge>
                    <ul className="space-y-1 text-sm">
                      <li>• Educational and productivity tools</li>
                      <li>• Entertainment and gaming applications</li>
                      <li>• Business and professional software</li>
                      <li>• Creative and design tools</li>
                      <li>• Health and fitness applications</li>
                      <li>• Developer tools and utilities</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Badge className="bg-red-100 text-red-800">Prohibited Content</Badge>
                    <ul className="space-y-1 text-sm">
                      <li>• Adult or explicit content</li>
                      <li>• Gambling or betting applications</li>
                      <li>• Hate speech or discriminatory content</li>
                      <li>• Illegal or harmful activities</li>
                      <li>• Spam or misleading applications</li>
                      <li>• Copyright infringing material</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  All content must be original or properly licensed. Apps with poor presentation, 
                  misleading descriptions, or low-quality assets will be rejected.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security & Privacy Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Security Standards</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h5 className="font-medium text-red-700">Critical Requirements</h5>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        No malicious code or backdoors
                      </li>
                      <li className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        Secure data transmission (HTTPS/TLS)
                      </li>
                      <li className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        Proper input validation and sanitization
                      </li>
                      <li className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        No unauthorized data collection
                      </li>
                      <li className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        Secure authentication mechanisms
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium text-blue-700">Privacy Protection</h5>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        Clear privacy policy (required)
                      </li>
                      <li className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        GDPR compliance for EU users
                      </li>
                      <li className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        Transparent data usage disclosure
                      </li>
                      <li className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        User consent for data collection
                      </li>
                      <li className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        Data deletion capabilities
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Required Documentation</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Privacy Policy</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p>• Data collection practices</p>
                      <p>• Third-party integrations</p>
                      <p>• User rights and controls</p>
                      <p>• Contact information</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Terms of Service</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p>• Usage guidelines</p>
                      <p>• Liability limitations</p>
                      <p>• Intellectual property</p>
                      <p>• Dispute resolution</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Support Documentation</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p>• User guides/tutorials</p>
                      <p>• FAQ section</p>
                      <p>• Contact support</p>
                      <p>• Troubleshooting</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  All apps undergo automated security scanning. Apps with security vulnerabilities, 
                  privacy violations, or missing required documentation will be rejected.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Business & Legal Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Developer Requirements</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h5 className="font-medium text-blue-700">Account Verification</h5>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        Verified developer account
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        Valid business registration (if applicable)
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        Tax information on file
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        Professional contact information
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium text-green-700">Support Standards</h5>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Responsive customer support
                      </li>
                      <li className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Clear support channels
                      </li>
                      <li className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Timely bug fixes and updates
                      </li>
                      <li className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Professional communication
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Pricing & Revenue</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Pricing Guidelines</h5>
                      <ul className="space-y-1 text-sm">
                        <li>• Fair and competitive pricing</li>
                        <li>• Clear value proposition</li>
                        <li>• No misleading "free" claims</li>
                        <li>• Transparent subscription terms</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Revenue Sharing</h5>
                      <ul className="space-y-1 text-sm">
                        <li>• 80% developer revenue share</li>
                        <li>• 20% platform fee</li>
                        <li>• Monthly automated payouts</li>
                        <li>• Detailed revenue reporting</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  Developers must maintain professional standards and provide ongoing support. 
                  Failure to respond to user issues or maintain app quality may result in removal.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Review Process & Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Review Stages</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <h5 className="font-medium">Automated Screening</h5>
                      <p className="text-sm text-muted-foreground">
                        Security scan, malware detection, and basic compliance checks (1-2 hours)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <h5 className="font-medium">Technical Review</h5>
                      <p className="text-sm text-muted-foreground">
                        Functionality testing, performance evaluation, and technical standards verification (1-3 days)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <h5 className="font-medium">Content & Quality Review</h5>
                      <p className="text-sm text-muted-foreground">
                        Manual review of content, presentation, and overall quality (2-5 days)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                      4
                    </div>
                    <div>
                      <h5 className="font-medium">Final Approval</h5>
                      <p className="text-sm text-muted-foreground">
                        Final review and marketplace publication (1 day)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Review Outcomes</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        Approved
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>App meets all guidelines and is published to the marketplace immediately.</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
                        <AlertTriangle className="w-4 h-4" />
                        Needs Revision
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>Minor issues identified. Developer receives detailed feedback for corrections.</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                        <XCircle className="w-4 h-4" />
                        Rejected
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>Significant issues or guideline violations. Detailed explanation provided.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Expedited Review</h4>
                <p className="text-sm text-blue-800">
                  Critical bug fixes and security updates can be fast-tracked for review within 24 hours. 
                  Contact our review team with justification for expedited processing.
                </p>
              </div>

              <Alert>
                <Eye className="h-4 w-4" />
                <AlertDescription>
                  Average review time is 3-7 business days. Complex applications or those requiring 
                  additional verification may take longer. Developers are notified at each stage.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
