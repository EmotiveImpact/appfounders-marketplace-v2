export interface BlogAuthor {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface BlogTag {
  tag: string;
}

export interface BlogSEO {
  title?: string;
  description?: string;
  keywords?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  author: BlogAuthor | string;
  publishedDate: string;
  category: string;
  status: 'draft' | 'published';
  featuredImage: {
    id: string;
    url: string;
    alt?: string;
  };
  summary: string;
  content: any; // Rich text content
  tags?: BlogTag[];
  seo?: BlogSEO;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
}

export type BlogCategory = 
  | 'app-development'
  | 'ux-design'
  | 'marketing'
  | 'business'
  | 'technology';

export interface BlogListResponse {
  docs: BlogPost[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}
