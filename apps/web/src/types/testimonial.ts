export interface TestimonialData {
  rating: number;
  source: string;
  text: string;
  image?: string;
}

// Partial Post interface containing only fields needed for testimonials
export interface Post {
  title: string;
  excerpt?: string;
  description: string;
  featuredImage?: string;
}

export interface TestimonialApiResponse {
  success: boolean;
  data: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
