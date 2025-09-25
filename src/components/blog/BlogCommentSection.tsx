import { useState, useEffect } from 'react';
import { User, Calendar } from 'lucide-react';
import { Comment } from '@/types/blog';

interface BlogCommentSectionProps {
  blogId: string;
}

const BlogCommentSection: React.FC<BlogCommentSectionProps> = ({ blogId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch comments for this blog post
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        // In a real implementation, this would fetch comments from an API
        // For now, we'll use mock data
        const mockComments: Comment[] = [
          {
            id: '1',
            author: 'Sarah Johnson',
            content: 'Great article! I found the insights on app development particularly helpful for my current project.',
            date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
          },
          {
            id: '2',
            author: 'Michael Chen',
            content: 'I appreciate the detailed explanation of the development process. Would love to see a follow-up article on testing strategies!',
            date: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
          },
        ];
        
        setComments(mockComments);
        setError(null);
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Failed to load comments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [blogId]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment || !name) return;
    
    // In a real implementation, this would send the comment to an API
    const newCommentObj: Comment = {
      id: `temp-${Date.now()}`,
      author: name,
      content: newComment,
      date: new Date().toISOString(),
    };
    
    setComments([newCommentObj, ...comments]);
    setNewComment('');
    // Don't clear name and email to make it easier for users to post multiple comments
  };

  // Format date to more readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>
      
      {/* Comment Form */}
      <form onSubmit={handleCommentSubmit} className="mb-8">
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Your name"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email (will not be published)
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Your email"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
            Comment *
          </label>
          <textarea
            id="comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Share your thoughts..."
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="bg-indigo-600 text-white rounded-md px-6 py-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Post Comment
        </button>
      </form>
      
      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <div className="mx-auto w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-2 text-sm text-gray-600">Loading comments...</p>
        </div>
      )}
      
      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-4 bg-red-50 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {/* Comments List */}
      {!loading && !error && (
        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-center mb-2">
                  <div className="bg-indigo-100 rounded-full w-10 h-10 flex items-center justify-center text-indigo-700 font-medium">
                    {comment.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{comment.author}</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(comment.date)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-gray-700 whitespace-pre-line">
                  {comment.content}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BlogCommentSection;
