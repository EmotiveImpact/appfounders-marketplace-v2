// Mock data for the marketplace
export const mockApps = [
  {
    id: 'app-1',
    name: 'DesignVault',
    description: 'All-in-one design system manager with component library, asset management, and collaboration tools. Perfect for design teams who want to maintain consistency across projects.',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?q=80&w=1000&auto=format&fit=crop',
    type: 'MAC',
    developer: 'PixelPerfect Studios',
    rating: 4.8,
    category: 'design',
    downloads: 12450,
    releaseDate: '2023-09-15',
    purchaseCount: 1247,
    screenshots: [
      'https://images.unsplash.com/photo-1545235617-9465d2a55698?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1558655146-9f40138edfeb?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1611224923853-80b023f02d71?q=80&w=1000&auto=format&fit=crop'
    ],
    features: [
      'Component library management',
      'Design token system',
      'Version control integration',
      'Real-time team collaboration',
      'Plugin ecosystem with 50+ integrations',
      'Advanced search and filtering',
      'Export to Figma, Sketch, and Adobe XD',
      'Dark mode support',
      'Custom branding options',
      'API access for automation'
    ]
  },
  {
    id: 'taskflow-pro',
    name: 'TaskFlow Pro',
    description: 'Revolutionary productivity app with advanced task management, AI-powered scheduling, and team collaboration features. Transform how you organize your work and boost productivity by 300%.',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1000&auto=format&fit=crop',
    type: 'IOS',
    developer: 'ProductivityLabs',
    rating: 4.8,
    category: 'productivity',
    downloads: 25680,
    releaseDate: '2023-11-20',
    purchaseCount: 2568,
    screenshots: [
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1611224923853-80b023f02d71?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1558655146-9f40138edfeb?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1545235617-9465d2a55698?q=80&w=1000&auto=format&fit=crop'
    ],
    features: [
      'AI-powered task prioritization',
      'Smart scheduling with calendar integration',
      'Real-time team collaboration',
      'Advanced project templates',
      'Time tracking with detailed analytics',
      'Custom workflows and automation',
      'Cross-platform synchronization',
      'Offline mode support',
      'Advanced reporting and insights',
      'Integration with 100+ popular tools',
      'Voice commands and dictation',
      'Dark mode and custom themes'
    ]
  },
  {
    id: 'app-2',
    name: 'CodeSphere',
    description: 'Advanced IDE with AI code completion, integrated debugging, and cross-platform development support.',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop',
    type: 'MAC',
    developer: 'DevForge',
    rating: 4.9,
    category: 'development',
    downloads: 28730,
    releaseDate: '2023-07-22',
    features: [
      'AI-powered code completion',
      'Integrated debugging tools',
      'Git integration',
      'Multi-language support',
      'Custom themes and extensions'
    ]
  },
  {
    id: 'app-3',
    name: 'TaskFlow',
    description: 'Project management tool with kanban boards, time tracking, and automated workflows for maximum productivity.',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?q=80&w=1000&auto=format&fit=crop',
    type: 'WEB',
    developer: 'ProductivityLabs',
    rating: 4.7,
    category: 'productivity',
    downloads: 35120,
    releaseDate: '2023-11-05',
    features: [
      'Customizable kanban boards',
      'Time tracking',
      'Automated workflows',
      'Team collaboration',
      'Reporting and analytics'
    ]
  },
  {
    id: 'app-4',
    name: 'PixelPro',
    description: 'Professional photo editing software with advanced retouching tools, filters, and batch processing capabilities.',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?q=80&w=1000&auto=format&fit=crop',
    type: 'PC',
    developer: 'CreativeTools',
    rating: 4.6,
    category: 'design',
    downloads: 19845,
    releaseDate: '2023-08-12',
    features: [
      'Advanced retouching tools',
      'Layer-based editing',
      'Custom filters and presets',
      'Batch processing',
      'RAW file support'
    ]
  },
  {
    id: 'app-5',
    name: 'SoundStudio',
    description: 'Professional audio production suite with multi-track recording, virtual instruments, and mastering tools.',
    price: 149.99,
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000&auto=format&fit=crop',
    type: 'MAC',
    developer: 'AudioWorks',
    rating: 4.8,
    category: 'entertainment',
    downloads: 15230,
    releaseDate: '2023-06-30',
    features: [
      'Multi-track recording',
      'Virtual instruments',
      'Audio effects library',
      'MIDI support',
      'Professional mastering tools'
    ]
  },
  {
    id: 'app-6',
    name: 'DataViz',
    description: 'Data visualization tool that transforms complex datasets into beautiful, interactive charts and dashboards.',
    price: 69.99,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop',
    type: 'WEB',
    developer: 'AnalyticsPro',
    rating: 4.5,
    category: 'productivity',
    downloads: 22780,
    releaseDate: '2023-10-18',
    features: [
      'Interactive chart builder',
      'Real-time data connections',
      'Dashboard creation',
      'Export and sharing options',
      'Template library'
    ]
  },
  {
    id: 'app-7',
    name: 'SecureVault',
    description: 'Password manager with end-to-end encryption, secure sharing, and breach monitoring for ultimate security.',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1000&auto=format&fit=crop',
    type: 'IOS',
    developer: 'CyberShield',
    rating: 4.9,
    category: 'utilities',
    downloads: 42650,
    releaseDate: '2023-09-05',
    features: [
      'End-to-end encryption',
      'Password generator',
      'Secure sharing',
      'Breach monitoring',
      'Cross-device sync'
    ]
  },
  {
    id: 'app-8',
    name: 'FitTrack',
    description: 'Comprehensive fitness tracking app with personalized workout plans, nutrition guidance, and progress analytics.',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=1000&auto=format&fit=crop',
    type: 'ANDROID',
    developer: 'HealthTech',
    rating: 4.7,
    category: 'health',
    downloads: 38920,
    releaseDate: '2023-07-15',
    features: [
      'Personalized workout plans',
      'Nutrition tracking',
      'Progress analytics',
      'Community challenges',
      'Integration with fitness devices'
    ]
  },
  {
    id: 'app-9',
    name: 'LearnLang',
    description: 'Language learning platform with interactive lessons, speech recognition, and personalized study plans.',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1000&auto=format&fit=crop',
    type: 'IOS',
    developer: 'EduTech',
    rating: 4.6,
    category: 'education',
    downloads: 25780,
    releaseDate: '2023-08-22',
    features: [
      'Interactive lessons',
      'Speech recognition',
      'Vocabulary building',
      'Personalized study plans',
      'Offline learning mode'
    ]
  },
  {
    id: 'app-10',
    name: 'SocialPulse',
    description: 'Social media management platform with content scheduling, analytics, and audience engagement tools.',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1000&auto=format&fit=crop',
    type: 'WEB',
    developer: 'MediaMasters',
    rating: 4.5,
    category: 'social',
    downloads: 18450,
    releaseDate: '2023-10-10',
    features: [
      'Content scheduling',
      'Analytics dashboard',
      'Audience engagement tools',
      'Multi-platform management',
      'Competitor analysis'
    ]
  },
  {
    id: 'app-11',
    name: 'TravelBuddy',
    description: 'All-in-one travel companion with itinerary planning, local recommendations, and offline maps.',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1000&auto=format&fit=crop',
    type: 'ANDROID',
    developer: 'WanderTech',
    rating: 4.7,
    category: 'travel',
    downloads: 31250,
    releaseDate: '2023-06-15',
    features: [
      'Itinerary planning',
      'Local recommendations',
      'Offline maps',
      'Currency converter',
      'Travel journal'
    ]
  },
  {
    id: 'app-12',
    name: 'MindfulMoment',
    description: 'Meditation and mindfulness app with guided sessions, sleep stories, and mood tracking.',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop',
    type: 'IOS',
    developer: 'ZenTech',
    rating: 4.8,
    category: 'health',
    downloads: 45780,
    releaseDate: '2023-11-20',
    features: [
      'Guided meditation sessions',
      'Sleep stories',
      'Breathing exercises',
      'Mood tracking',
      'Customizable meditation timer'
    ]
  }
];
