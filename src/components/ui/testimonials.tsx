"use client";

import { TestimonialsSection } from '@/components/blocks/testimonials-with-marquee';

// Testimonials data for the marquee
const marqueeTestimonials = [
  {
    author: {
      name: "Emma Thompson",
      handle: "@emmaai",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face"
    },
    text: "This platform has transformed how we discover apps. The one-time payment model is a game-changer for our business.",
    href: "#"
  },
  {
    author: {
      name: "David Park",
      handle: "@davidtech",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    text: "I've found incredible productivity tools here that have saved our team countless hours. The quality of apps is consistently high.",
    href: "#"
  },
  {
    author: {
      name: "Sofia Rodriguez",
      handle: "@sofiadev",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
    },
    text: "As a developer, I appreciate the fair pricing model. It's refreshing to see a platform that values both creators and customers."
  },
  {
    author: {
      name: "James Wilson",
      handle: "@jwilson",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
    },
    text: "The beta testing program helped us refine our app before launch. The feedback we received was invaluable for our development process."
  }
];

const Testimonials = () => {
  return (
    <section className="py-10 bg-white">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Marquee Testimonials */}
        <TestimonialsSection
          title="Trusted by developers worldwide"
          description="Join thousands of developers who are already building amazing products with our platform"
          testimonials={marqueeTestimonials}
        />
      </div>
    </section>
  );
};

export default Testimonials;
