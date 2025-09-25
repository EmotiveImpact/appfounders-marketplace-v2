import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AvatarGroup } from '@/components/ui/avatar-group';

const HeroSection = () => {
  return (
    <section className="relative pt-12 pb-16 overflow-hidden bg-white">
      {/* Radial gradient background effect from center */}
      <div className="absolute inset-0 bg-gradient-radial from-indigo-50 via-purple-50/50 to-white pointer-events-none" />
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 pointer-events-none" />
      
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-gray-900">The </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
              Beta Tester
            </span>
            <span className="text-gray-900"> </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
              Marketplace
            </span>
            <span className="text-gray-900"> for </span>
            <span className="block text-gray-900">Innovative Digital Solutions</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl">
            Built for developers who need <em className="not-italic font-medium">more</em> than just testers. 
            Connect with real users, get valuable feedback, and build a community around your app 
            — all through an intuitive marketplace.
          </p>
          
          {/* Avatar group */}
          <div className="mb-10">
            <AvatarGroup />
          </div>
          
          {/* Stats section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 w-full max-w-3xl">
            <div className="flex flex-col items-center">
              <p className="text-4xl font-bold text-indigo-600">200+</p>
              <p className="text-gray-600">Apps Available</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-4xl font-bold text-indigo-600">5,000+</p>
              <p className="text-gray-600">Active Testers</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-4xl font-bold text-indigo-600">$0</p>
              <p className="text-gray-600">Upfront Costs</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
