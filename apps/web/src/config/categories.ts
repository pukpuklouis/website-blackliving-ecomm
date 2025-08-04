export interface CategoryConfig {
  title: string;
  description: string;
  series: string;
  brand: string;
  features: string[];
  seoKeywords: string;
  category: string;
  urlPath: string;
}

export const CATEGORIES: Record<string, CategoryConfig> = {
  'simmons-black': {
    title: '席夢思黑標床墊系列 | 美國原裝進口 | 黑哥家居',
    description: '席夢思頂級黑標床墊系列，美國原裝進口，採用獨立筒彈簧技術，提供絕佳支撐與舒適度。全台最低價保證，10年品質保固，免費到府安裝。',
    series: '席夢思黑標',
    brand: 'Simmons 席夢思',
    features: ['10年品質保固', '全台最低價保證', '免費到府安裝'],
    seoKeywords: '席夢思,黑標,床墊,美國進口,獨立筒,彈簧床墊,台灣,黑哥家居',
    category: 'simmons-black',
    urlPath: '/simmons-black'
  },
  'accessories': {
    title: '精選周邊配件 | 睡眠品質提升 | 黑哥家居',
    description: '提升睡眠品質的精選配件，包含枕頭、床包、保潔墊等專業睡眠用品。搭配席夢思床墊，打造完美睡眠環境。',
    series: '周邊配件',
    brand: '黑哥家居',
    features: ['品質保證', '專業搭配', '貼心服務'],
    seoKeywords: '睡眠配件,枕頭,床包,保潔墊,睡眠用品,黑哥家居',
    category: 'accessories',
    urlPath: '/accessories'
  },
  'us-imports': {
    title: '美國進口床墊 | 頂級睡眠體驗 | 黑哥家居',
    description: '精選美國進口床墊品牌系列，提供多樣化選擇。採用頂級材質與工藝，帶來卓越睡眠體驗。',
    series: '美國進口',
    brand: '黑哥家居',
    features: ['原裝進口', '品質認證', '專業服務'],
    seoKeywords: '美國進口,床墊,頂級睡眠,進口寢具,黑哥家居',
    category: 'us-imports',
    urlPath: '/us-imports'
  }
};

export function getCategoryConfig(categoryKey: string): CategoryConfig | null {
  return CATEGORIES[categoryKey] || null;
}

export function getAllCategories(): CategoryConfig[] {
  return Object.values(CATEGORIES);
}