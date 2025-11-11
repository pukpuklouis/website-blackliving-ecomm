import { z } from 'zod';

// Product Type Template Interfaces
export interface ProductTypeTemplate {
  id: string;
  name: string;
  category: string;
  variantAxes: VariantAxis[];
  defaultOptions: ProductOptions;
  requiredFields: string[];
  optionalFields: string[];
}

export interface VariantAxis {
  id: string;
  name: string;
  type: 'size' | 'color' | 'weight' | 'thickness' | 'loft' | 'material' | 'style' | 'firmness';
  values: string[];
  required: boolean;
  displayOrder: number;
}

export interface ProductOptions {
  sizes?: string[];
  colors?: string[];
  weights?: string[];
  thicknesses?: string[];
  lofts?: string[];
  materials?: string[];
  styles?: string[];
  firmnesses?: string[];
}

// Zod schemas for validation
export const VariantAxisSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['size', 'color', 'weight', 'thickness', 'loft', 'material', 'style', 'firmness']),
  values: z.array(z.string()),
  required: z.boolean(),
  displayOrder: z.number(),
});

export const ProductOptionsSchema = z.object({
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  weights: z.array(z.string()).optional(),
  thicknesses: z.array(z.string()).optional(),
  lofts: z.array(z.string()).optional(),
  materials: z.array(z.string()).optional(),
  styles: z.array(z.string()).optional(),
  firmnesses: z.array(z.string()).optional(),
});

export const ProductTypeTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  variantAxes: z.array(VariantAxisSchema),
  defaultOptions: ProductOptionsSchema,
  requiredFields: z.array(z.string()),
  optionalFields: z.array(z.string()),
});

// Product Type Templates Configuration
export const PRODUCT_TYPE_TEMPLATES: Record<string, ProductTypeTemplate> = {
  mattress: {
    id: 'mattress',
    name: '床墊',
    category: 'simmons-black',
    variantAxes: [
      {
        id: 'size',
        name: 'Size',
        type: 'size',
        values: ['Twin XL(96x200)', 'Full(135x190)', 'Queen(150x200)', 'King(195x200)', 'Cal King(180x210)'],
        required: true,
        displayOrder: 1,
      },
      {
        id: 'firmness',
        name: 'Firmness',
        type: 'firmness',
        values: ['Plush(偏軟)', 'Medium(中等)', 'Firm(偏硬)', 'Extra Firm(最硬)'],
        required: true,
        displayOrder: 2,
      },
    ],
    defaultOptions: {
      sizes: ['Twin XL(96x200)', 'Full(135x190)', 'Queen(150x200)', 'King(195x200)', 'Cal King(180x210)'],
      styles: ['Plush(偏軟)', 'Medium(中等)', 'Firm(偏硬)', 'Extra Firm(最硬)'],
      firmnesses: ['Plush(偏軟)', 'Medium(中等)', 'Firm(偏硬)', 'Extra Firm(最硬)'],
    },
    requiredFields: ['name', 'description', 'category', 'variants'],
    optionalFields: ['featuresMarkdown', 'specifications', 'seoTitle', 'seoDescription'],
  },

  protector: {
    id: 'protector',
    name: '保潔墊',
    category: 'accessories',
    variantAxes: [
      {
        id: 'size',
        name: 'Size',
        type: 'size',
        values: ['Twin XL(96x200)', 'Full(135x190)', 'Queen(150x200)', 'King(195x200)', 'Cal King(180x210)'],
        required: true,
        displayOrder: 1,
      },
      {
        id: 'material',
        name: '材質',
        type: 'material',
        values: ['純棉', '聚酯纖維', '尼龍', '聚酯纖維'],
        required: true,
        displayOrder: 2,
      },
    ],
    defaultOptions: {
      sizes: ['Twin XL(96x200)', 'Full(135x190)', 'Queen(150x200)', 'King(195x200)', 'Cal King(180x210)'],
      materials: ['純棉', '聚酯纖維', '尼龍', '聚酯纖維'],
    },
    requiredFields: ['name', 'description', 'category', 'variants', 'parentProductId'],
    optionalFields: ['featuresMarkdown', 'specifications', 'seoTitle', 'seoDescription'],
  },

  sheetSet: {
    id: 'sheet-set',
    name: '床包組',
    category: 'accessories',
    variantAxes: [
      {
        id: 'size',
        name: 'Size',
        type: 'size',
        values: ['Twin XL(96x200)', 'Full(135x190)', 'Queen(150x200)', 'King(195x200)', 'Cal King(180x210)'],
        required: true,
        displayOrder: 1,
      },
      {
        id: 'color',
        name: 'Color',
        type: 'color',
        values: ['極光白', '晨霧灰', '緞香金'],
        required: false,
        displayOrder: 2,
      },
      {
        id: 'material',
        name: 'Material',
        type: 'material',
        values: ['純棉', '埃及棉', '天絲', '法蘭絨'],
        required: false,
        displayOrder: 3,
      },
    ],
    defaultOptions: {
      sizes: ['Twin XL(96x200)', 'Full(135x190)', 'Queen(150x200)', 'King(195x200)', 'Cal King(180x210)'],
      colors: ['極光白', '晨霧灰', '緞香金'],
      materials: ['純棉', '埃及棉', '天絲', '法蘭絨'],
    },
    requiredFields: ['name', 'description', 'category', 'variants', 'parentProductId'],
    optionalFields: ['featuresMarkdown', 'specifications', 'seoTitle', 'seoDescription'],
  },

  pillow: {
    id: 'pillow',
    name: '枕頭',
    category: 'accessories',
    variantAxes: [
      {
        id: 'size',
        name: 'Size',
        type: 'size',
        values: ['標準枕頭', '加大枕頭'],
        required: false,
        displayOrder: 1,
      },
      {
        id: 'loft',
        name: '柔軟度',
        type: 'loft',
        values: ['偏軟', '中等', '偏硬'],
        required: true,
        displayOrder: 2,
      },
      {
        id: 'material',
        name: '材質',
        type: 'material',
        values: ['記憶棉', '羽絨', '羽毛', '乳膠', '蕎麥'],
        required: true,
        displayOrder: 3,
      },
    ],
    defaultOptions: {
      sizes: ['標準枕頭', '加大枕頭'],
      lofts: ['偏軟', '中等', '偏硬'],
      materials: ['記憶棉', '羽絨', '羽毛', '乳膠', '蕎麥'],
    },
    requiredFields: ['name', 'description', 'category', 'variants', 'parentProductId'],
    optionalFields: ['featuresMarkdown', 'specifications', 'seoTitle', 'seoDescription'],
  },

  duvet: {
    id: 'duvet',
    name: '被子',
    category: 'accessories',
    variantAxes: [
      {
        id: 'size',
        name: 'Size',
        type: 'size',
        values: ['Twin XL(96x200)', 'Full(135x190)', 'Queen(150x200)', 'King(195x200)', 'Cal King(180x210)'],
        required: true,
        displayOrder: 1,
      },
      {
        id: 'loft',
        name: '柔軟度',
        type: 'loft',
        values: ['偏軟', '中等', '偏硬'],
        required: true,
        displayOrder: 2,
      },
      {
        id: 'material',
        name: '材質',
        type: 'material',
        values: ['羽絨', '羽毛', '蠶絲', '羊毛', '合成纖維'],
        required: true,
        displayOrder: 3,
      },
    ],
    defaultOptions: {
      sizes: ['Twin XL(96x200)', 'Full(135x190)', 'Queen(150x200)', 'King(195x200)', 'Cal King(180x210)'],
      lofts: ['偏軟', '中等', '偏硬'],
      materials: ['羽絨', '羽毛', '蠶絲', '羊毛', '合成纖維'],
    },
    requiredFields: ['name', 'description', 'category', 'variants', 'parentProductId'],
    optionalFields: ['featuresMarkdown', 'specifications', 'seoTitle', 'seoDescription'],
  },

  topper: {
    id: 'topper',
    name: '墊層',
    category: 'accessories',
    variantAxes: [
      {
        id: 'size',
        name: 'Size',
        type: 'size',
        values: ['Twin XL(96x200)', 'Full(135x190)', 'Queen(150x200)', 'King(195x200)', 'Cal King(180x210)'],
        required: true,
        displayOrder: 1,
      },
      {
        id: 'thickness',
        name: '厚度',
        type: 'thickness',
        values: ['1 inch', '2 inch', '3 inch', '4 inch'],
        required: true,
        displayOrder: 2,
      },
      {
        id: 'material',
        name: 'Material',
        type: 'material',
        values: ['記憶棉', '乳膠', '混合', '獨立筒'],
        required: true,
        displayOrder: 3,
      },
    ],
    defaultOptions: {
      sizes: ['Twin XL(96x200)', 'Full(135x190)', 'Queen(150x200)', 'King(195x200)', 'Cal King(180x210)'],
      thicknesses: ['1 inch', '2 inch', '3 inch', '4 inch'],
      materials: ['記憶棉', '乳膠', '混合', '獨立筒'],
    },
    requiredFields: ['name', 'description', 'category', 'variants', 'parentProductId'],
    optionalFields: ['featuresMarkdown', 'specifications', 'seoTitle', 'seoDescription'],
  },

  adjustableBase: {
    id: 'adjustable-base',
    name: '電動床墊',
    category: 'accessories',
    variantAxes: [
      {
        id: 'size',
        name: 'Size',
        type: 'size',
        values: ['Twin XL(96x200)', 'Full(135x190)', 'Queen(150x200)', 'King(195x200)', 'Cal King(180x210)'],
        required: true,
        displayOrder: 1,
      },
      {
        id: 'style',
        name: '款式',
        type: 'style',
        values: ['基本款', '豪華款', '頂級款'],
        required: false,
        displayOrder: 2,
      },
    ],
    defaultOptions: {
      sizes: ['Twin XL(96x200)', 'Full(135x190)', 'Queen(150x200)', 'King(195x200)', 'Cal King(180x210)'],
      styles: ['基本款', '豪華款', '頂級款'],
    },
    requiredFields: ['name', 'description', 'category', 'variants', 'parentProductId'],
    optionalFields: ['featuresMarkdown', 'specifications', 'seoTitle', 'seoDescription'],
  },
};

// Utility functions
export function getProductTypeTemplate(typeId: string): ProductTypeTemplate | undefined {
  return PRODUCT_TYPE_TEMPLATES[typeId];
}

export function getAllProductTypeTemplates(): ProductTypeTemplate[] {
  return Object.values(PRODUCT_TYPE_TEMPLATES);
}

export function validateProductTypeTemplate(template: ProductTypeTemplate): boolean {
  try {
    ProductTypeTemplateSchema.parse(template);
    return true;
  } catch {
    return false;
  }
}

export function getTemplateByCategory(category: string): ProductTypeTemplate[] {
  return Object.values(PRODUCT_TYPE_TEMPLATES).filter(template => template.category === category);
}

export function getRequiredVariantAxes(template: ProductTypeTemplate): VariantAxis[] {
  return template.variantAxes.filter(axis => axis.required);
}

export function generateVariantCombinations(template: ProductTypeTemplate): any[] {
  const requiredAxes = getRequiredVariantAxes(template);
  if (requiredAxes.length === 0) return [];

  // Simple combination generation for required axes
  const combinations: any[] = [];

  function generateCombinations(axes: VariantAxis[], index: number, current: any) {
    if (index === axes.length) {
      combinations.push({ ...current });
      return;
    }

    const axis = axes[index];
    for (const value of axis.values) {
      current[axis.type] = value;
      generateCombinations(axes, index + 1, current);
    }
  }

  generateCombinations(requiredAxes, 0, {});
  return combinations;
}

export type { ProductTypeTemplate, VariantAxis, ProductOptions };
