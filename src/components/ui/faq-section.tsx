"use client";

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How do I get the starter kits?",
    answer: "Once you purchase lifetime access to an app, you'll immediately receive access to all starter kits and resources through your tester dashboard. These include documentation, API references, and any other materials provided by the developer."
  },
  {
    question: "What do I need to get the most out of AppFounders?",
    answer: "To maximize your experience, we recommend having devices that match the platforms you're interested in testing (iOS, Android, Web, Mac, or PC). A stable internet connection and a willingness to provide detailed feedback will help you become a valuable tester and build relationships with developers."
  },
  {
    question: "What other perks/benefits do I get?",
    answer: "As a lifetime access member, you'll receive all future updates at no additional cost, direct communication with developers, early access to new features, the ability to influence product direction, and recognition for your contributions. Some developers also offer additional perks like premium support or credits for their other products."
  },
  {
    question: "How does the payment system work?",
    answer: "AppFounders uses a one-time payment model for lifetime access. You pay once for an app and receive lifetime access to all updates and features. The platform handles all transactions securely, with 80% going to the developer and 20% to platform maintenance and improvement."
  },
  {
    question: "Can I become both a tester and a developer?",
    answer: "Absolutely! Many of our users maintain both tester and developer accounts. This dual perspective often leads to better app development and testing skills. You can easily switch between roles from your account settings."
  },
  {
    question: "How do I report bugs or suggest features?",
    answer: "Each app in your tester dashboard has dedicated sections for bug reports and feature suggestions. These are sent directly to developers, who can respond and provide updates on implementation status. Detailed reports with screenshots or videos are highly appreciated."
  }
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have a different question not listed here? Reach out to our team via our contact page.
          </p>
        </div>

        <div className="max-w-3xl mx-auto divide-y divide-gray-200">
          {faqs.map((faq, index) => (
            <div key={index} className="py-6">
              <button
                onClick={() => toggleFAQ(index)}
                className="flex justify-between items-center w-full text-left font-bold text-lg text-gray-900"
              >
                <span>{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-indigo-600 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`} 
                />
              </button>
              <div 
                className={`mt-3 text-gray-600 transition-all duration-300 overflow-hidden ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="pb-4">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
