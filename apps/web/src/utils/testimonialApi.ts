import type {
  Post,
  TestimonialApiResponse,
  TestimonialData,
} from "../types/testimonial";

const CACHE_KEY = "testimonials:featured";
const CACHE_TTL = 300; // 5 minutes in seconds

const memoryCache = new Map<
  string,
  { data: TestimonialData[]; expires: number }
>();

function transformPostToTestimonial(post: Post): TestimonialData {
  return {
    rating: 5, // Default to 5 stars for featured testimonials as per design
    source: post.title,
    text: post.excerpt || post.description,
    image: post.featuredImage,
  };
}

export async function fetchTestimonials(): Promise<TestimonialData[]> {
  try {
    // Check memory cache
    const cached = memoryCache.get(CACHE_KEY);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Fetch from API
    const apiUrl = import.meta.env.PUBLIC_API_URL || "http://localhost:8787";
    const response = await fetch(
      `${apiUrl}/api/posts/public?category=blogger-testimonial&featured=true&limit=4`
    );

    if (!response.ok) {
      throw new Error(
        `API returned ${response.status}: ${response.statusText}`
      );
    }

    const data: TestimonialApiResponse = await response.json();

    if (!data.success) {
      throw new Error("API response indicated failure");
    }

    // Transform Data
    const testimonials = data.data.map(transformPostToTestimonial);

    // Update Cache
    memoryCache.set(CACHE_KEY, {
      data: testimonials,
      expires: Date.now() + CACHE_TTL * 1000,
    });

    return testimonials;
  } catch (error) {
    console.error("Failed to fetch testimonials:", error);
    throw error;
  }
}

export function resetCacheForTesting() {
  memoryCache.clear();
}
