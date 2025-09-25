'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const resourceCategories = [
    {
      title: 'Documentation',
      description: 'Comprehensive guides and API references',
      items: [
        { title: 'Getting Started', link: '/resources/documentation/getting-started', icon: '📘' },
        { title: 'API Reference', link: '/resources/documentation/api', icon: '🔌' },
        { title: 'Tutorials', link: '/resources/documentation/tutorials', icon: '📝' },
        { title: 'Best Practices', link: '/resources/documentation/best-practices', icon: '✅' },
      ]
    },
    {
      title: 'Developer Resources',
      description: 'Tools and resources for app developers',
      items: [
        { title: 'SDK Downloads', link: '/resources/developer/sdk', icon: '💻' },
        { title: 'Sample Projects', link: '/resources/developer/samples', icon: '📁' },
        { title: 'Developer Forum', link: '/resources/developer/forum', icon: '💬' },
        { title: 'Release Notes', link: '/resources/developer/releases', icon: '📋' },
      ]
    },
    {
      title: 'Tester Resources',
      description: 'Tools and guides for app testers',
      items: [
        { title: 'Testing Guidelines', link: '/resources/tester/guidelines', icon: '📊' },
        { title: 'Bug Reporting', link: '/resources/tester/bug-reporting', icon: '🐛' },
        { title: 'Test Case Templates', link: '/resources/tester/templates', icon: '📑' },
        { title: 'Testing Tools', link: '/resources/tester/tools', icon: '🔧' },
      ]
    },
    {
      title: 'Community',
      description: 'Connect with other AppFounders users',
      items: [
        { title: 'Community Forums', link: '/resources/community/forums', icon: '👥' },
        { title: 'Events & Webinars', link: '/resources/community/events', icon: '📅' },
        { title: 'Success Stories', link: '/resources/community/success-stories', icon: '🏆' },
        { title: 'Contribute', link: '/resources/community/contribute', icon: '🤝' },
      ]
    }
  ];
  
  // Filter resources based on search query
  const filteredCategories = searchQuery 
    ? resourceCategories.map(category => ({
        ...category,
        items: category.items.filter(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.items.length > 0)
    : resourceCategories;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Resources</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to succeed with AppFounders - guides, documentation, tools, and community resources.
          </p>
          
          {/* Search bar */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search resources..."
                className="w-full py-3 px-4 pl-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>
        </div>
        
        {/* Resource categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredCategories.map((category, index) => (
            <Card key={index} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{category.title}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <Link href={item.link} className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                        <span className="text-2xl mr-3">{item.icon}</span>
                        <span className="text-gray-800 hover:text-blue-600">{item.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href={`/resources/${category.title.toLowerCase().replace(' ', '-')}`}>
                  <Button variant="outline">View All {category.title}</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {/* Featured resource */}
        <div className="mt-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row">
            <div className="p-8 md:p-12 md:w-1/2">
              <h2 className="text-3xl font-bold text-white mb-4">Developer Certification Program</h2>
              <p className="text-blue-100 mb-6">
                Become a certified AppFounders developer and showcase your expertise to clients and employers.
                Our certification program covers best practices, advanced techniques, and real-world scenarios.
              </p>
              <Link href="/resources/certification">
                <Button className="bg-white text-blue-600 hover:bg-blue-50">Learn More</Button>
              </Link>
            </div>
            <div className="md:w-1/2 relative h-64 md:h-auto">
              <Image 
                src="/images/certification.jpg" 
                alt="Developer Certification"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
