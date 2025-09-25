import Image from 'next/image';
import { cn } from '@/lib/utils';

interface PhoneFrameProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function PhoneFrame({
  src,
  alt,
  className,
  priority = false,
}: PhoneFrameProps) {
  return (
    <div className={cn("relative aspect-[366/729] w-full", className)}>
      <div className="absolute inset-y-0 left-0 right-0 rounded-[2.5rem] border-[0.3125rem] border-gray-900 bg-gray-800 shadow-xl">
        <div className="absolute left-1/2 top-0 h-[0.8125rem] w-[8.75rem] -translate-x-1/2 rounded-b-[0.625rem] bg-gray-800"></div>
        <div className="absolute left-1/2 top-0 h-[0.25rem] w-[5.875rem] -translate-x-1/2 rounded-b-[0.625rem] bg-gray-800"></div>
        <div className="absolute inset-[0.3125rem] rounded-[2.1875rem] overflow-hidden bg-gray-50">
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}

export function RealisticPhoneFrame({
  src,
  alt,
  className,
  priority = false,
}: PhoneFrameProps) {
  return (
    <div className={cn("relative aspect-[366/729] w-full", className)}>
      <div className="absolute inset-y-0 left-0 right-0 rounded-[2.5rem] border-[0.3125rem] border-gray-900 bg-gray-800 shadow-xl">
        <div className="absolute top-[0.8125rem] left-1/2 h-[0.25rem] w-[40%] -translate-x-1/2 rounded-full bg-gray-700"></div>
        <div className="absolute top-0 left-1/2 h-[0.8125rem] w-[35%] -translate-x-1/2 rounded-b-[0.625rem] bg-gray-800"></div>
        <div className="absolute inset-[0.3125rem] rounded-[2.1875rem] overflow-hidden bg-gray-50">
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
