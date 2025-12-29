// Using crypto.randomUUID for unique ID generation instead of cuid2
function createId(): string {
  return crypto.randomUUID().replace(/-/g, "").substring(0, 8);
}

// SKU abbreviation mappings
const ABBREVIATIONS = {
  // Sizes
  Twin: "TW",
  "Twin XL": "TX",
  Full: "FU",
  Queen: "QN",
  King: "KG",
  "California King": "CK",
  Standard: "ST",
  "Full/Queen": "FQ",

  // Colors
  White: "WH",
  Gray: "GY",
  Navy: "NV",
  Beige: "BE",
  Black: "BK",
  Blue: "BL",
  Red: "RD",
  Green: "GN",
  Yellow: "YW",
  Purple: "PL",
  Pink: "PK",
  Brown: "BN",
  Orange: "OR",

  // Weights
  Light: "LT",
  Medium: "MD",
  Heavy: "HV",

  // Thicknesses
  "1 inch": "1I",
  "2 inch": "2I",
  "3 inch": "3I",
  "4 inch": "4I",

  // Lofts
  Low: "LO",
  "Medium Loft": "ML",
  High: "HI",

  // Materials
  Cotton: "CT",
  Tencel: "TC",
  Bamboo: "BB",
  Microfiber: "MF",
  "Memory Foam": "MF",
  Down: "DN",
  Feather: "FT",
  Latex: "LX",
  Buckwheat: "BW",
  Silk: "SK",
  Wool: "WL",
  Synthetic: "SY",
  "Egyptian Cotton": "EC",
  Sateen: "ST",
  Flannel: "FL",
  Hybrid: "HY",
  Innerspring: "IS",
} as const;

// Category mappings
const CATEGORY_CODES = {
  mattress: "MT",
  protector: "PR",
  "sheet-set": "SS",
  pillow: "PL",
  duvet: "DV",
  topper: "TP",
  "adjustable-base": "AB",
} as const;

export interface SKUVariant {
  size?: string;
  color?: string;
  weight?: string;
  thickness?: string;
  loft?: string;
  material?: string;
  style?: string;
  firmness?: string;
  [key: string]: string | undefined;
}

export interface SKUOptions {
  category: string;
  series?: string;
  variant: SKUVariant;
}

export interface SKUResult {
  sku: string;
  isValid: boolean;
  length: number;
  suggestions?: string[];
}

/**
 * Generate SKU following format: {CATEGORY}-{SERIES}-{SIZE}-{ATTR...}
 */
export function generateSKU(options: SKUOptions): SKUResult {
  const { category, series = "STD", variant } = options;

  // Get category code
  const categoryCode =
    CATEGORY_CODES[category as keyof typeof CATEGORY_CODES] || "XX";

  // Start with category and series
  const parts = [categoryCode, series];

  // Add variant attributes in order: size, then other attributes
  if (variant.size) {
    const sizeAbbrev =
      ABBREVIATIONS[variant.size as keyof typeof ABBREVIATIONS] ||
      variant.size.substring(0, 2).toUpperCase();
    parts.push(sizeAbbrev);
  }

  // Add other variant attributes
  const attributeOrder = [
    "color",
    "firmness",
    "material",
    "thickness",
    "loft",
    "weight",
    "style",
  ];
  for (const attr of attributeOrder) {
    if (variant[attr]) {
      const value = variant[attr]!;
      const abbrev =
        ABBREVIATIONS[value as keyof typeof ABBREVIATIONS] ||
        value.substring(0, 2).toUpperCase();
      parts.push(abbrev);
    }
  }

  // Join parts
  const sku = parts.join("-");

  // Validate length
  const isValid = sku.length <= 32;
  const result: SKUResult = {
    sku,
    isValid,
    length: sku.length,
  };

  // Generate suggestions if invalid
  if (!isValid) {
    result.suggestions = generateSKUSuggestions(options);
  }

  return result;
}

/**
 * Generate SKU suggestions for conflicts or length issues
 */
export function generateSKUSuggestions(options: SKUOptions): string[] {
  const suggestions: string[] = [];
  const { category, series = "STD", variant } = options;

  // Try shorter series name
  if (series !== "STD") {
    const shortSeries = series.substring(0, 2).toUpperCase();
    const result = generateSKU({ ...options, series: shortSeries });
    if (result.isValid) {
      suggestions.push(result.sku);
    }
  }

  // Try removing optional attributes
  const optionalAttrs = ["style", "weight"];
  for (const attr of optionalAttrs) {
    if (variant[attr]) {
      const modifiedVariant = { ...variant };
      delete modifiedVariant[attr];
      const result = generateSKU({
        category,
        series,
        variant: modifiedVariant,
      });
      if (result.isValid && !suggestions.includes(result.sku)) {
        suggestions.push(result.sku);
      }
    }
  }

  // Try using first letter abbreviations for long values
  const longValueAttrs = Object.keys(variant).filter(
    (key) =>
      variant[key] &&
      variant[key]!.length > 2 &&
      !ABBREVIATIONS[variant[key] as keyof typeof ABBREVIATIONS]
  );

  for (const attr of longValueAttrs) {
    const modifiedVariant = { ...variant };
    modifiedVariant[attr] = variant[attr]!.substring(0, 1).toUpperCase();
    const result = generateSKU({ category, series, variant: modifiedVariant });
    if (result.isValid && !suggestions.includes(result.sku)) {
      suggestions.push(result.sku);
    }
  }

  // If still no valid suggestions, try minimal SKU
  if (suggestions.length === 0) {
    const categoryCode =
      CATEGORY_CODES[category as keyof typeof CATEGORY_CODES] || "XX";
    const minimalSKU = `${categoryCode}-${series}-${variant.size ? ABBREVIATIONS[variant.size as keyof typeof ABBREVIATIONS] || "XX" : "XX"}`;
    if (minimalSKU.length <= 32) {
      suggestions.push(minimalSKU);
    }
  }

  return suggestions.slice(0, 5); // Limit to 5 suggestions
}

/**
 * Validate SKU uniqueness (placeholder - would check against database)
 */
export async function validateSKUUniqueness(
  sku: string,
  excludeId?: string
): Promise<boolean> {
  // TODO: Implement database check
  // For now, return true (would be replaced with actual DB query)
  return true;
}

/**
 * Generate unique SKU with conflict resolution
 */
export async function generateUniqueSKU(
  options: SKUOptions,
  excludeId?: string
): Promise<SKUResult> {
  const result = generateSKU(options);

  if (result.isValid && (await validateSKUUniqueness(result.sku, excludeId))) {
    return result;
  }

  // Try suggestions
  if (result.suggestions) {
    for (const suggestion of result.suggestions) {
      if (await validateSKUUniqueness(suggestion, excludeId)) {
        return {
          sku: suggestion,
          isValid: true,
          length: suggestion.length,
        };
      }
    }
  }

  // Last resort: add random suffix
  const randomSuffix = createId().substring(0, 4).toUpperCase();
  const fallbackSKU = `${result.sku.substring(0, 27)}-${randomSuffix}`;

  return {
    sku: fallbackSKU,
    isValid: fallbackSKU.length <= 32,
    length: fallbackSKU.length,
  };
}

/**
 * Parse SKU back to components (for reverse engineering)
 */
export function parseSKU(
  sku: string
): { category?: string; series?: string; attributes: string[] } | null {
  const parts = sku.split("-");
  if (parts.length < 2) return null;

  const category = Object.keys(CATEGORY_CODES).find(
    (key) => CATEGORY_CODES[key as keyof typeof CATEGORY_CODES] === parts[0]
  );

  return {
    category,
    series: parts[1],
    attributes: parts.slice(2),
  };
}

/**
 * Bulk SKU generation for variants
 */
export async function generateBulkSKUs(
  category: string,
  series: string,
  variants: SKUVariant[],
  excludeId?: string
): Promise<SKUResult[]> {
  const results: SKUResult[] = [];

  for (const variant of variants) {
    const result = await generateUniqueSKU(
      { category, series, variant },
      excludeId
    );
    results.push(result);
  }

  return results;
}

/**
 * Get SKU abbreviation for a value
 */
export function getSKUAbbreviation(value: string): string {
  return (
    ABBREVIATIONS[value as keyof typeof ABBREVIATIONS] ||
    value.substring(0, 2).toUpperCase()
  );
}

/**
 * Validate SKU format
 */
export function validateSKUFormat(sku: string): boolean {
  // Basic format validation: CATEGORY-SERIES-ATTRS...
  const parts = sku.split("-");
  return (
    parts.length >= 2 &&
    parts.every((part) => part.length >= 2 && part.length <= 4)
  );
}
