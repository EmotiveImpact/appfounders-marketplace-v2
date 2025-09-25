"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';

const MidSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-indigo-50/30">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">How AppFounders Works</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our platform connects developers with testers through a simple, transparent process
          </p>
        </div>
        
        {/* Process steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <ProcessCard 
            number="01"
            title="Discover"
            description="Browse through a curated selection of innovative apps across multiple platforms and categories."
            icon={
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          />
          
          <ProcessCard 
            number="02"
            title="Connect"
            description="Purchase lifetime access to apps that interest you and connect directly with the developers."
            icon={
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          />
          
          <ProcessCard 
            number="03"
            title="Collaborate"
            description="Provide valuable feedback to help developers improve their products and receive all future updates."
            icon={
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.418 16.97 20 12 20C10.5286 20 9.14629 19.6635 7.94358 19.079L3 20L4.3915 16.0633C3.54365 14.7754 3 13.3155 3 12C3 7.58172 7.02944 4 12 4C16.97 4 21 7.58172 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          />
        </div>
        
        {/* Feature highlight */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Image side */}
            <div className="relative h-64 lg:h-auto">
              <Image
                src="/images/app-screenshot.png"
                alt="App marketplace preview"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 mix-blend-multiply"></div>
            </div>
            
            {/* Content side */}
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-4 text-gray-900">One-time payment, lifetime updates</h3>
              <p className="text-gray-600 mb-6">
                Our unique business model ensures that developers receive fair compensation while testers get lifetime access to apps and all future updates with just a single payment.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">No subscription fees or hidden costs</p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">All future updates included</p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">Direct developer communication</p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">Early access to new features</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Process card component
const ProcessCard = ({ number, title, description, icon }: { 
  number: string; 
  title: string; 
  description: string;
  icon: React.ReactNode;
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      viewport={{ once: true }}
      className="flex flex-col items-center text-center"
    >
      <div className="relative mb-6">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md relative z-10">
          <div className="text-indigo-600">
            {icon}
          </div>
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-medium flex items-center justify-center">
          {number}
        </div>
      </div>
      
      <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};

export default MidSection;
