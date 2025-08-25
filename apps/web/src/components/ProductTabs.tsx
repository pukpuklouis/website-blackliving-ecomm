import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@blackliving/ui';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@blackliving/ui/components/ui/table';
import { Check, Star, Award, Truck, Shield } from 'lucide-react';

interface ProductTabsProps {
  features: string[];
  specifications?: Record<string, any> | null;
  categoryFeatures: string[];
  categoryName: string;
}

export default function ProductTabs({ 
  features, 
  specifications, 
  categoryFeatures, 
  categoryName 
}: ProductTabsProps) {
  // Determine which features to display
  const displayFeatures = features && features.length > 0 ? features : [
    ...categoryFeatures,
    // Add special feature for simmons-black category
    ...(categoryName === 'simmons-black' ? ['美國原裝進口'] : [])
  ];

  // Check if specifications exist and have content
  const hasSpecifications = specifications && Object.keys(specifications).length > 0;

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
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="features" className="text-sm font-medium">
            商品詳情
          </TabsTrigger>
          <TabsTrigger 
            value="specifications" 
            disabled={!hasSpecifications}
            className="text-sm font-medium"
          >
            產品規格
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="features" className="mt-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">產品特色</h3>
            <div className="grid gap-3">
              {displayFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {getFeatureIcon(feature)}
                  </div>
                  <span className="text-gray-700 leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="specifications" className="mt-6">
          {hasSpecifications ? (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="p-6 pb-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">技術規格</h3>
              </div>
              <div className="px-6 pb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-gray-900">規格項目</TableHead>
                      <TableHead className="font-semibold text-gray-900">詳細資訊</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(specifications!).map(([key, value], index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-600">
                          {key}
                        </TableCell>
                        <TableCell className="text-gray-900">
                          {value}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Table className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暫無規格資料</h3>
              <p className="text-gray-500">此產品的詳細技術規格資料正在整理中</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}