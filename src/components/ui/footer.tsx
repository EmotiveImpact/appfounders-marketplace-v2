import Link from 'next/link';
import { Instagram, Youtube, Github, Twitter } from 'lucide-react';
import { Button } from './button';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Use Cases */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">Use Cases</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/use-cases/beta-testing" className="text-sm text-gray-400 hover:text-white">
                  Beta Testing Platform
                </Link>
              </li>
              <li>
                <Link href="/use-cases/app-marketplace" className="text-sm text-gray-400 hover:text-white">
                  App Marketplace
                </Link>
              </li>
              <li>
                <Link href="/use-cases/developer-tools" className="text-sm text-gray-400 hover:text-white">
                  Developer Tools
                </Link>
              </li>
              <li>
                <Link href="/use-cases/tester-community" className="text-sm text-gray-400 hover:text-white">
                  Tester Community
                </Link>
              </li>
            </ul>
          </div>

          {/* For Developers */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">For Developers</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/developers/dashboard" className="text-sm text-gray-400 hover:text-white">
                  Developer Dashboard
                </Link>
              </li>
              <li>
                <Link href="/developers/documentation" className="text-sm text-gray-400 hover:text-white">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/developers/community" className="text-sm text-gray-400 hover:text-white">
                  Community Help
                </Link>
              </li>
              <li>
                <Link href="/developers/roadmap" className="text-sm text-gray-400 hover:text-white">
                  Platform Roadmap
                </Link>
              </li>
              <li>
                <Link href="/developers/resources" className="text-sm text-gray-400 hover:text-white">
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/developers/submit-app" className="text-sm text-gray-400 hover:text-white">
                  Submit Your App
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">Company</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/pricing" className="text-sm text-gray-400 hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/enterprise" className="text-sm text-gray-400 hover:text-white">
                  Enterprise
                </Link>
              </li>
              <li>
                <Link href="/case-studies" className="text-sm text-gray-400 hover:text-white">
                  Case Studies
                </Link>
              </li>
              <li>
                <Link href="/partner-program" className="text-sm text-gray-400 hover:text-white">
                  Partner Program
                </Link>
              </li>
              <li>
                <Link href="/find-partners" className="text-sm text-gray-400 hover:text-white">
                  Find Partners
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-gray-400 hover:text-white">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-sm text-gray-400 hover:text-white">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-400 hover:text-white">
                  About AppFounders
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-400 hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-400 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-400 hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Stay Connected */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">Stay Connected</h3>
            <div className="mt-4">
              <div className="flex items-center border-b border-gray-800 pb-2">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full bg-transparent text-sm text-gray-400 focus:outline-none"
                />
                <button className="ml-2 text-gray-400 hover:text-white">
                  <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="mt-6 flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Youtube className="h-5 w-5" />
                <span className="sr-only">YouTube</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
            </div>
            <div className="mt-8">
              <select className="bg-transparent text-gray-400 border border-gray-800 rounded-md p-2 text-sm w-full focus:outline-none focus:border-gray-700">
                <option value="auto">Auto</option>
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
              </select>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-gray-800 pt-8">
          <p className="text-sm text-gray-400 text-center">
            &copy; {currentYear} AppFounders. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
