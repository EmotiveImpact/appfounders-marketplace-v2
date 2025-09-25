'use client';

import React, { useState } from 'react';
import LogoGenerator from '@/components/ui/logo-generator';

const LogoGeneratorPage: React.FC = () => {
  const [variant, setVariant] = useState<'brackets' | 'code-tags'>('code-tags');
  const [size, setSize] = useState<number>(32);

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">AppFounders Logo Generator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Logo Options</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo Variant
            </label>
            <div className="flex gap-4">
              <button
                className={`px-4 py-2 rounded-md ${
                  variant === 'code-tags' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                onClick={() => setVariant('code-tags')}
              >
                Code Tags &lt;/&gt;
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  variant === 'brackets' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                onClick={() => setVariant('brackets')}
              >
                Code Brackets
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo Size (px)
            </label>
            <input
              type="range"
              min="16"
              max="128"
              step="16"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-500 mt-1">
              {size} x {size} pixels
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-4">Preview & Download</h2>
          <LogoGenerator variant={variant} width={size} height={size} />
        </div>
      </div>
    </div>
  );
};

export default LogoGeneratorPage;
