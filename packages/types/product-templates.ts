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
  type: 'size' | 'color' | 'weight' | 'thickness' | 'loft' | 'material' | 'style' | 'firmness' | 'height' | 'legs';
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
  heights?: string[];
  legs?: string[];
}

// Zod schemas for validation
export const VariantAxisSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['size', 'color', 'weight', 'thickness', 'loft', 'material', 'style', 'firmness', 'height', 'legs']),
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
  heights: z.array(z.string()).optional(),
  legs: z.array(z.string()).optional(),
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
        values: ['Twin XL(96x200)', 'Full(135x190)', 'Queen(150x200)', 'King(190x200)', 'Cal King(180x210)'],
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
      sizes: ['Twin XL(96x200)', 'Full(135x190)', 'Queen(150x200)', 'King(190x200)', 'Cal King(180x210)'],
      firmnesses: ['Plush(偏軟)', 'Medium(中等)', 'Firm(偏硬)', 'Extra Firm(最硬)'],
    },
    requiredFields: ['name', 'description', 'category', 'variants'],
    optionalFields: ['featuresMarkdown', 'specifications', 'seoTitle', 'seoDescription'],
  },

  foundation: {
    id: 'foundation',
    name: '下墊',
    category: 'accessories',
    variantAxes: [
      {
        id: 'size',
        name: 'Size',
        type: 'size',
        values: ['Queen(150x200)', 'King(190x200)', 'Cal King(180x210)'],
        required: true,
        displayOrder: 1,
      },
      {
        id: 'color',
        name: 'Color',
        type: 'color',
        values: [
          '細色(Y8301)', '靛藍色(Y8302)', '碧色(Y8303)', '琥珀色(Y8304)', '藏青色(Y8305)',
          '魚白色(Y8306)', '稻殼色(Y8307)', '蒸栗色(Y8308)', '海老茶(Y8309)', '銀鼠色(Y8310)',
          '芽灰色(Y8311)', '流沙色(Y8312)', '岩井色(Y8313)', '黑珍珠(Y8314)', '紺青色(Y8315)',
          '胡珀綠(Y8316)', '芒果黃(Y8317)', '蟹殼橙(Y8318)', '胭粉色(Y8319)', '薰衣紫(Y8320)'
        ],
        required: false,
        displayOrder: 2,
      },
      {
        id: 'legs',
        name: '床腳',
        type: 'legs',
        values: ['胡桃(6cm)', '胡桃(12cm)', '白橡(6cm)', '白橡(12cm)', '塑鋼黑(10cm)'],
        required: false,
        displayOrder: 3,
      }
    ],
    defaultOptions: {
      sizes: ['Queen(150x200)', 'King(190x200)', 'Cal King(180x210)'],
      colors: ['細色(Y8301)', '黑珍珠(Y8314)'],
      legs: ['胡桃(12cm)', '塑鋼黑(10cm)'],
    },
    requiredFields: ['name', 'description', 'category', 'variants'],
    optionalFields: ['featuresMarkdown', 'specifications'],
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
        values: ['Twin XL(96x200)', 'Full(135x190)', 'Queen(150x200)', 'King(190x200)', 'Cal King(180x210)'],
        required: true,
        displayOrder: 1,
      }
    ],
    defaultOptions: {
      sizes: ['Twin XL(96x200)', 'Full(135x190)', 'Queen(150x200)', 'King(190x200)', 'Cal King(180x210)'],
    },
    requiredFields: ['name', 'description', 'category', 'variants'],
    optionalFields: [],
  },

  sheetSet: {
    id: 'sheet-set',
    name: '寢具組',
    category: 'accessories',
    variantAxes: [
      {
        id: 'size',
        name: 'Size',
        type: 'size',
        values: [
          'Twin(96x190)', 'Twin XL(96x200)', 'Full(135x190)',
          'Full XL(135x200)', 'Queen(150x200)', 'King(190x200)', 'Cal King(180x210)'
        ],
        required: true,
        displayOrder: 1,
      },
      {
        id: 'color',
        name: 'Color',
        type: 'color',
        values: ['晨霧灰', '極光白', '緞香金'],
        required: false,
        displayOrder: 2,
      }
    ],
    defaultOptions: {
      sizes: ['Twin(96x190)', 'Twin XL(96x200)', 'Full(135x190)', 'Full XL(135x200)', 'Queen(150x200)', 'King(190x200)', 'Cal King(180x210)'],
      colors: ['晨霧灰'],
    },
    requiredFields: ['name', 'description', 'category', 'variants'],
    optionalFields: ['featuresMarkdown', 'specifications'],
  },

  pillow: {
    id: 'pillow',
    name: '枕頭',
    category: 'accessories',
    variantAxes: [
      {
        id: 'loft',
        name: '柔軟度',
        type: 'loft',
        values: ['柔軟Soft', '中等Medium', '偏硬Firm'],
        required: false,
        displayOrder: 1,
      },
      {
        id: 'height',
        name: '高度',
        type: 'height',
        values: ['8 cm', '11 cm'],
        required: false,
        displayOrder: 2,
      },
      {
        id: 'material',
        name: '材質',
        type: 'material',
        values: ['記憶棉', '羽絨', '乳膠'],
        required: false,
        displayOrder: 3,
      },
    ],
    defaultOptions: {
      lofts: ['Soft', 'Medium', 'Firm'],
      heights: ['8 cm', '11 cm'],
      materials: ['記憶棉', '羽絨', '乳膠'],
    },
    requiredFields: ['name', 'description', 'category', 'variants'],
    optionalFields: ['featuresMarkdown', 'specifications'],
  },

  duvet: {
    id: 'duvet',
    name: '被子',
    category: 'accessories',
    variantAxes: [
      { id: 'size', name: 'Size', type: 'size', values: ['Queen', 'King'], required: true, displayOrder: 1 }
    ],
    defaultOptions: { sizes: ['Queen', 'King'] },
    requiredFields: ['name', 'category'],
    optionalFields: []
  },

  topper: {
    id: 'topper',
    name: '舒適墊',
    category: 'accessories',
    variantAxes: [
      { id: 'size', name: 'Size', type: 'size', values: ['Queen', 'King'], required: true, displayOrder: 1 }
    ],
    defaultOptions: { sizes: ['Queen', 'King'] },
    requiredFields: ['name', 'category'],
    optionalFields: []
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
        values: ['Queen(150x200)', 'King(190x200)', 'Cal King(180x210)'],
        required: true,
        displayOrder: 1,
      },
    ],
    defaultOptions: {
      sizes: ['Queen(150x200)', 'King(190x200)', 'Cal King(180x210)'],
    },
    requiredFields: ['name', 'description', 'category', 'variants'],
    optionalFields: ['featuresMarkdown', 'specifications'],
  },
};

// Utility functions
export function getProductTypeTemplate(typeId: string): ProductTypeTemplate | undefined {
  // First try direct object key lookup (for backward compatibility with camelCase keys like 'sheetSet')
  if (PRODUCT_TYPE_TEMPLATES[typeId]) {
    return PRODUCT_TYPE_TEMPLATES[typeId];
  }

  // If not found, search by template.id (for kebab-case IDs like 'sheet-set')
  return Object.values(PRODUCT_TYPE_TEMPLATES).find(template => template.id === typeId);
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

// Display Names Mapping
export const OPTION_DISPLAY_NAMES: Record<string, string> = {
  size: '尺寸',
  firmness: '軟硬度',
  color: '顏色',
  loft: '柔軟度',
  height: '高度',
  material: '材質',
  legs: '床腳',
  style: '款式',
  weight: '重量',
  thickness: '厚度',
};
