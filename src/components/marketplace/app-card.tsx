'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import PlatformLogo from '@/components/ui/platform-logo';

interface AppCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  type: 'IOS' | 'ANDROID' | 'WEB' | 'MAC' | 'PC';
  developer: string;
  rating?: number;
}

const AppCard = ({
  id,
  name,
  description,
  price,
  image,
  type,
  developer,
  rating = 0,
}: AppCardProps) => {
  return (
    <Link href={`/marketplace/${id}`}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="group relative h-full flex flex-col overflow-hidden rounded-xl bg-white transition-all hover:shadow-md cursor-pointer"
        whileHover={{ 
          y: -5,
          boxShadow: "0 15px 30px rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* App image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
        
        {/* Content */}
        <div className="flex flex-col flex-grow p-5">
          {/* App name and price */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg text-gray-900">{name}</h3>
            <div className="text-sm font-medium text-indigo-600">
              {formatCurrency(price)}
            </div>
          </div>
          
          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">{description}</p>
          
          {/* Developer info and platform type */}
          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {developer.charAt(0)}
              </div>
              <span className="text-xs text-gray-500 ml-2">{developer}</span>
            </div>
            
            <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
              <PlatformLogo platform={type} className="text-gray-700" size={14} />
              <span className="text-xs font-medium text-gray-700 ml-1.5">{type}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default AppCard;
