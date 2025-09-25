'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, Menu, X, User } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import CodeBracketLogo from './code-bracket-logo';

const Navbar = () => {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const toggleResourcesDropdown = () => {
    setResourcesDropdownOpen(!resourcesDropdownOpen);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  const closeDropdowns = () => {
    setResourcesDropdownOpen(false);
    setUserDropdownOpen(false);
  };

  const handleSignOut = () => {
    signOut();
    closeDropdowns();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center" onClick={closeDropdowns}>
              <CodeBracketLogo className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">AppFounders</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/marketplace" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
              onClick={closeDropdowns}
            >
              Marketplace
            </Link>
            
            {/* Resources Dropdown */}
            <div className="relative">
              <button
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                onClick={toggleResourcesDropdown}
              >
                Resources
                <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${resourcesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {resourcesDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-2 grid grid-cols-1 gap-1">
                    <div className="px-4 py-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">For Developers</h3>
                      <div className="mt-2 space-y-1">
                        <Link 
                          href="/resources/documentation" 
                          className="block px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100"
                          onClick={closeDropdowns}
                        >
                          Documentation
                        </Link>
                        <Link 
                          href="/dashboard/developer" 
                          className="block px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100"
                          onClick={closeDropdowns}
                        >
                          Developer Dashboard
                        </Link>
                        <Link 
                          href="/resources/developer/sdk" 
                          className="block px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100"
                          onClick={closeDropdowns}
                        >
                          SDK & Tools
                        </Link>
                      </div>
                    </div>
                    
                    <div className="px-4 py-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">For Testers</h3>
                      <div className="mt-2 space-y-1">
                        <Link 
                          href="/dashboard/tester" 
                          className="block px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100"
                          onClick={closeDropdowns}
                        >
                          Tester Dashboard
                        </Link>
                        <Link 
                          href="/resources/tester/guidelines" 
                          className="block px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100"
                          onClick={closeDropdowns}
                        >
                          Testing Guidelines
                        </Link>
                        <Link 
                          href="/resources/tester/bug-reporting" 
                          className="block px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100"
                          onClick={closeDropdowns}
                        >
                          Bug Reporting
                        </Link>
                      </div>
                    </div>
                    
                    <div className="px-4 py-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Community</h3>
                      <div className="mt-2 space-y-1">
                        <Link 
                          href="/resources/community/forums" 
                          className="block px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100"
                          onClick={closeDropdowns}
                        >
                          Forums
                        </Link>
                        <Link 
                          href="/resources/community/events" 
                          className="block px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100"
                          onClick={closeDropdowns}
                        >
                          Events & Webinars
                        </Link>
                        <Link 
                          href="/blog" 
                          className="block px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100"
                          onClick={closeDropdowns}
                        >
                          Blog
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Link 
              href="/contact" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
              onClick={closeDropdowns}
            >
              Contact
            </Link>
          </nav>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* User menu or Sign in */}
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={toggleUserDropdown}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline-block">{user.name || user.email}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-1">Role: {user.role || 'User'}</p>
                      </div>
                      
                      <Link 
                        href={`/dashboard/${user.role || ''}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={closeDropdowns}
                      >
                        Dashboard
                      </Link>
                      
                      <Link 
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={closeDropdowns}
                      >
                        Profile Settings
                      </Link>
                      
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link 
                  href="/sign-in"
                  className="text-gray-600 hover:text-gray-900 transition-colors px-3 py-2"
                  onClick={closeDropdowns}
                >
                  Sign In
                </Link>
                <Link 
                  href="/sign-up"
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
                  onClick={closeDropdowns}
                >
                  Sign Up
                </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <button
              className="md:hidden rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              href="/marketplace"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Marketplace
            </Link>
            
            <div className="space-y-1">
              <div className="px-3 py-2 font-medium text-gray-700">Resources</div>
              
              <div className="pl-4 space-y-1">
                <div className="px-3 py-1 text-sm font-medium text-gray-500">For Developers</div>
                <Link 
                  href="/resources/documentation"
                  className="block px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Documentation
                </Link>
                <Link 
                  href="/dashboard/developer"
                  className="block px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Developer Dashboard
                </Link>
                
                <div className="mt-2 px-3 py-1 text-sm font-medium text-gray-500">For Testers</div>
                <Link 
                  href="/dashboard/tester"
                  className="block px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Tester Dashboard
                </Link>
                <Link 
                  href="/resources/tester/bug-reporting"
                  className="block px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Bug Reporting
                </Link>
              </div>
            </div>
            
            <Link 
              href="/contact"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
