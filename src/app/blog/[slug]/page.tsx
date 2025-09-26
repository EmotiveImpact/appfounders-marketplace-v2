'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, User, Tag, ArrowLeft, Clock } from 'lucide-react';
import { getBlogPostBySlug } from '@/lib/services/blogService';
import { BlogPost } from '@/types/blog';
import BlogCommentSection from '@/components/blog/BlogCommentSection';

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        const post = await getBlogPostBySlug(slug);
        setBlog(post);
        setError(null);
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError('Failed to load blog post. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [slug]);

  // Format date to more readable format
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Calculate read time (approximately 200 words per minute)
  const calculateReadTime = (content: any): string => {
    if (!content) return '3 min read';
    
    // For rich text content, we need to extract text
    let text = '';
    if (typeof content === 'string') {
      text = content;
    } else if (Array.isArray(content)) {
      // Handle rich text format
      text = content
        .map(node => {
          if (typeof node === 'string') return node;
          if (node.children) return node.children.map((child: any) => child.text || '').join(' ');
          return '';
        })
        .join(' ');
    }
    
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  // Render rich text content
  const renderContent = (content: any) => {
    if (!content) return null;
    
    if (typeof content === 'string') {
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }
    
    if (Array.isArray(content)) {
      return (
        <div className="prose prose-lg max-w-none">
          {content.map((node, index) => {
            if (typeof node === 'string') {
              return <p key={index}>{node}</p>;
            }
            
            if (node.type === 'h1') {
              return <h1 key={index}>{node.children.map((child: any) => child.text).join('')}</h1>;
            }
            
            if (node.type === 'h2') {
              return <h2 key={index}>{node.children.map((child: any) => child.text).join('')}</h2>;
            }

            if (node.type === 'h3') {
              return <h3 key={index}>{node.children.map((child: any) => child.text).join('')}</h3>;
            }

            if (node.type === 'p') {
              return <p key={index}>{node.children.map((child: any) => child.text).join('')}</p>;
            }
            
            if (node.type === 'ul') {
              return (
                <ul key={index}>
                  {node.children.map((li, liIndex) => (
                    <li key={liIndex}>{li.children.map((child: any) => child.text).join('')}</li>
                  ))}
                </ul>
              );
            }

            if (node.type === 'ol') {
              return (
                <ol key={index}>
                  {node.children.map((li, liIndex) => (
                    <li key={liIndex}>{li.children.map((child: any) => child.text).join('')}</li>
                  ))}
                </ol>
              );
            }
            
            if (node.type === 'blockquote') {
              return (
                <blockquote key={index} className="border-l-4 border-indigo-500 pl-4 italic">
                  {node.children.map((child: any) => child.text).join('')}
                </blockquote>
              );
            }
            
            return <p key={index}>{JSON.stringify(node)}</p>;
          })}
        </div>
      );
    }
    
    return <p>Content format not supported</p>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back to blogs link */}
      <div className="bg-white border-b">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/blog" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to all blogs
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-32">
          <div className="mx-auto w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading blog post...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center py-12 bg-red-50 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Blog Content */}
      {!loading && !error && blog && (
        <div>
          {/* Hero Section */}
          <div className="relative h-96 bg-gray-900">
            {blog.featuredImage && (
              <Image
                src={blog.featuredImage.url}
                alt={blog.title}
                fill
                className="object-cover opacity-60"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-white mb-4">{blog.title}</h1>
                <div className="flex items-center justify-center text-white space-x-4">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    <span>{typeof blog.author === 'string' ? blog.author : blog.author.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(blog.publishedDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{calculateReadTime(blog.content)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white rounded-lg shadow-sm p-8">
              {/* Summary */}
              <div className="text-lg text-gray-700 mb-8 font-medium italic border-l-4 border-indigo-500 pl-4">
                {blog.summary}
              </div>

              {/* Main Content */}
              <div className="prose prose-lg max-w-none">
                {renderContent(blog.content)}
              </div>

              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="mt-12 pt-6 border-t border-gray-200">
                  <div className="flex items-center flex-wrap gap-2">
                    <Tag className="h-5 w-5 text-gray-500" />
                    {blog.tags.map((tag, index) => (
                      <Link 
                        key={index}
                        href={`/blog?tag=${encodeURIComponent(tag.tag)}`}
                        className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-3 py-1 rounded-full"
                      >
                        {tag.tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="mt-12">
              <BlogCommentSection blogId={blog.id} />
            </div>

            {/* Related Posts (to be implemented) */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
              <p className="text-gray-500">Coming soon...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
