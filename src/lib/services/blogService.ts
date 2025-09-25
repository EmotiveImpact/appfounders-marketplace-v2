import { BlogListResponse, BlogPost } from '@/types/blog';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Fetch all blog posts with pagination
 */
export async function getBlogPosts(
  page = 1,
  limit = 10,
  category?: string,
  tag?: string
): Promise<BlogListResponse> {
  try {
    let url = `${API_URL}/payload?path=/api/blogs`;
    const params = new URLSearchParams();
    
    // Add pagination
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    // Add filters if provided
    if (category) {
      params.append('where[category][equals]', category);
    }
    
    if (tag) {
      params.append('where[tags.tag][contains]', tag);
    }
    
    // Only show published posts
    params.append('where[status][equals]', 'published');
    
    // Sort by publish date descending
    params.append('sort', '-publishedDate');
    
    // Add params to URL
    url = `${url}&${params.toString()}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blog posts: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return {
      docs: [],
      totalDocs: 0,
      limit,
      totalPages: 0,
      page,
      pagingCounter: 0,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    };
  }
}

/**
 * Fetch a single blog post by slug
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const url = `${API_URL}/payload?path=/api/blogs&where[slug][equals]=${encodeURIComponent(slug)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blog post: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Return the first post if found
    return data.docs && data.docs.length > 0 ? data.docs[0] : null;
  } catch (error) {
    console.error(`Error fetching blog post with slug "${slug}":`, error);
    return null;
  }
}

/**
 * Fetch blog posts by category
 */
export async function getBlogPostsByCategory(
  category: string,
  page = 1,
  limit = 10
): Promise<BlogListResponse> {
  return getBlogPosts(page, limit, category);
}

/**
 * Fetch blog posts by tag
 */
export async function getBlogPostsByTag(
  tag: string,
  page = 1,
  limit = 10
): Promise<BlogListResponse> {
  return getBlogPosts(page, limit, undefined, tag);
}

/**
 * Fetch featured blog posts
 */
export async function getFeaturedBlogPosts(limit = 3): Promise<BlogPost[]> {
  try {
    const data = await getBlogPosts(1, limit);
    return data.docs;
  } catch (error) {
    console.error('Error fetching featured blog posts:', error);
    return [];
  }
}

/**
 * Fetch recent blog posts
 */
export async function getRecentBlogPosts(limit = 5): Promise<BlogPost[]> {
  try {
    const data = await getBlogPosts(1, limit);
    return data.docs;
  } catch (error) {
    console.error('Error fetching recent blog posts:', error);
    return [];
  }
}

/**
 * Fetch blog categories with post counts
 */
export async function getBlogCategories(): Promise<{ name: string; count: number }[]> {
  try {
    const url = `${API_URL}/payload?path=/api/blogs/categories`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blog categories: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return [];
  }
}
