import { ReactNode } from 'react';

interface StepProps {
  title: string;
  description: string;
  icon: ReactNode;
  isLast?: boolean;
}

const Step = ({ title, description, icon, isLast = false }: StepProps) => {
  return (
    <div className="flex flex-col items-center text-center relative">
      {/* Connecting line */}
      {!isLast && (
        <div className="hidden lg:block absolute top-10 left-[calc(100%_-_10px)] w-full h-0.5 bg-gradient-to-r from-indigo-200 to-purple-200 transform -translate-y-1/2 z-0"></div>
      )}
      
      {/* Icon container */}
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 mb-6 shadow-md relative z-10">
        <div className="text-indigo-600 w-10 h-10">
          {icon}
        </div>
      </div>
      
      {/* Content */}
      <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-600 max-w-xs">{description}</p>
    </div>
  );
};

const HowItWorks = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-indigo-50/30">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our platform connects app developers with beta testers through a simple, transparent process.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          <Step 
            title="Join"
            description="Sign up as a developer or tester to access the platform."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            }
          />
          
          <Step 
            title="List Your App"
            description="Developers can list their applications with detailed information and requirements."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="16" height="16" x="4" y="4" rx="2"></rect>
                <path d="M4 12h16"></path>
                <path d="M12 4v16"></path>
              </svg>
            }
          />
          
          <Step 
            title="Connect"
            description="Testers discover apps that match their interests and expertise."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4z"></path>
                <path d="M6 12h2"></path>
                <path d="M16 12h2"></path>
                <path d="M12 6v2"></path>
                <path d="M12 16v2"></path>
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            }
          />
          
          <Step 
            title="Collaborate"
            description="Developers receive valuable feedback to improve their products before launch."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 12h8"></path>
                <path d="M12 16V8"></path>
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            }
            isLast={true}
          />
        </div>
        
        {/* Mobile view connecting lines */}
        <div className="lg:hidden flex flex-col items-center mt-8">
          <div className="h-16 w-0.5 bg-gradient-to-b from-indigo-200 to-purple-200"></div>
          <div className="h-4 w-4 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 mb-4"></div>
          <p className="text-sm text-gray-500 text-center max-w-xs">
            Our seamless process ensures both developers and testers get maximum value from the platform.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
