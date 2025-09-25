import Link from 'next/link';
import Image from 'next/image';
import { Calendar, User } from 'lucide-react';

const BlogCard = ({ blog }) => {
  return (
    <Link href={`/blog/${blog.id}`} className="block bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative h-48">
        <Image src={blog.image} alt={blog.title} fill className="object-cover" />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors">
          {blog.title}
        </h3>
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <User className="h-4 w-4 mr-1" /> {blog.author}
          <span className="mx-2">•</span>
          <Calendar className="h-4 w-4 mr-1" /> {blog.date}
        </div>
        <p className="text-gray-600 line-clamp-3">{blog.excerpt}</p>
      </div>
    </Link>
  );
};

export default BlogCard;
