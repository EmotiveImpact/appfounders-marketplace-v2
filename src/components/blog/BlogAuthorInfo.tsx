import { User, Calendar } from 'lucide-react';

const BlogAuthorInfo = ({ author, date }) => {
  return (
    <div className="flex items-center text-sm text-gray-500 mb-4">
      <User className="h-4 w-4 mr-1" /> {author}
      <span className="mx-2">•</span>
      <Calendar className="h-4 w-4 mr-1" /> {date}
    </div>
  );
};

export default BlogAuthorInfo;
