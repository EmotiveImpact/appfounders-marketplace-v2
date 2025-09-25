import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface FeaturedCtaProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
}

const FeaturedCta = ({
  title = "Want your app featured?",
  description = "We're always looking to support and feature community members who are building cool things with AppFounders.",
  buttonText = "Submit Your App",
  buttonHref = "/submit-app"
}: FeaturedCtaProps) => {
  return (
    <div className="bg-indigo-500 rounded-xl p-8 text-white">
      <h3 className="text-3xl font-bold mb-4">{title}</h3>
      <p className="mb-6 text-indigo-100">{description}</p>
      <Link 
        href={buttonHref}
        className="flex justify-center w-full sm:w-auto items-center bg-white text-indigo-600 font-medium px-6 py-3 rounded-full hover:bg-indigo-50 transition-colors"
      >
        {buttonText} <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </div>
  );
};

export default FeaturedCta;
