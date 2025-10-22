export interface CategoryConfig {
  slug: string;
  title: string;
  description: string;
  series: string;
  brand: string;
  features: string[];
  seoKeywords: string;
  category: string;
  urlPath: string;
  isActive?: boolean;
  sortOrder?: number;
}
