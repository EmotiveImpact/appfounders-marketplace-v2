import { AppQualityGuidelines } from '@/components/guidelines/app-quality-guidelines';

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <AppQualityGuidelines />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'App Quality Guidelines - AppFounders',
  description: 'Comprehensive guidelines for app submission and approval on the AppFounders marketplace.',
};
