import { BlogPost } from '../types/blog';

// Mock blog data
const mockBlogs: BlogPost[] = [
  {
    id: '1',
    title: 'Getting Started with App Development',
    excerpt: 'Learn the fundamentals of app development and how to create your first app with our step-by-step guide.',
    author: 'John Smith',
    date: '2025-02-15',
    category: 'Development',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
  },
  {
    id: '2',
    title: 'The Future of Mobile App Monetization',
    excerpt: 'Explore the latest trends and strategies for monetizing your mobile applications in today\'s competitive market.',
    author: 'Sarah Johnson',
    date: '2025-02-10',
    category: 'Business',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
  },
  // Add more mock data as needed
];

export const getBlogs = () => {
  return new Promise<BlogPost[]>((resolve) => {
    setTimeout(() => {
      resolve(mockBlogs);
    }, 1000);
  });
};
