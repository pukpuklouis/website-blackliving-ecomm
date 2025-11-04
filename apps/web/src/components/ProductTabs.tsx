import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@blackliving/ui';
import { Check, Star, Award, Truck, Shield } from 'lucide-react';

interface ProductTabsProps {
  features: string[];
  categoryFeatures: string[];
  categoryName: string;
}

export default function ProductTabs({
  features,
  categoryFeatures,
  categoryName,
}: ProductTabsProps) {
  // Determine which features to display
  const displayFeatures =
    features && features.length > 0
      ? features
      : [
          ...categoryFeatures,
          // Add special feature for simmons-black category
          ...(categoryName === 'simmons-black' ? ['美國原裝進口'] : []),
        ];

  // Icon mapping for features
  const getFeatureIcon = (feature: string) => {
    const lowerFeature = feature.toLowerCase();
    if (lowerFeature.includes('進口') || lowerFeature.includes('原裝')) {
      return <Award className="h-4 w-4 text-amber-500" />;
    }
    if (lowerFeature.includes('品質') || lowerFeature.includes('保證')) {
      return <Shield className="h-4 w-4 text-blue-500" />;
    }
    if (lowerFeature.includes('配送') || lowerFeature.includes('送貨')) {
      return <Truck className="h-4 w-4 text-green-500" />;
    }
    if (lowerFeature.includes('頂級') || lowerFeature.includes('高級')) {
      return <Star className="h-4 w-4 text-purple-500" />;
    }
    return <Check className="h-4 w-4 text-green-600" />;
  };

  return (
    <div className="mt-8">
      <Tabs defaultValue="features" className="max-w-5xl mx-auto">
        <TabsList className="grid w-full grid-cols-1 h-14 md:h-16">
          <TabsTrigger value="features" className="text-lg md:text-2xl font-medium">
            商品詳情
          </TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="mt-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">產品特色</h3>
            <div className="grid gap-3">
              {displayFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">{getFeatureIcon(feature)}</div>
                  <span className="text-gray-700 leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
