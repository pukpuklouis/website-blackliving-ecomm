import { Tabs, TabsContent, TabsList, TabsTrigger } from "@blackliving/ui";
import { Award, Check, Shield, Star, Truck } from "lucide-react";
import { useMemo } from "react";
import { renderMarkdownToHtml } from "../utils/markdown";

interface ProductTabsProps {
  features: string[];
  categoryFeatures: string[];
  categoryName: string;
  featuresMarkdown?: string;
}

export default function ProductTabs({
  features,
  categoryFeatures,
  categoryName,
  featuresMarkdown,
}: ProductTabsProps) {
  // Determine which features to display
  const displayFeatures =
    features && features.length > 0
      ? features
      : [
          ...categoryFeatures,
          // Add special feature for simmons-black category
          ...(categoryName === "simmons-black" ? ["美國原裝進口"] : []),
        ];

  // Icon mapping for features
  const getFeatureIcon = (feature: string) => {
    const lowerFeature = feature.toLowerCase();
    if (lowerFeature.includes("進口") || lowerFeature.includes("原裝")) {
      return <Award className="h-4 w-4 text-amber-500" />;
    }
    if (lowerFeature.includes("品質") || lowerFeature.includes("保證")) {
      return <Shield className="h-4 w-4 text-blue-500" />;
    }
    if (lowerFeature.includes("配送") || lowerFeature.includes("送貨")) {
      return <Truck className="h-4 w-4 text-green-500" />;
    }
    if (lowerFeature.includes("頂級") || lowerFeature.includes("高級")) {
      return <Star className="h-4 w-4 text-purple-500" />;
    }
    return <Check className="h-4 w-4 text-green-600" />;
  };

  const sanitizedMarkdown = useMemo(
    () => renderMarkdownToHtml(featuresMarkdown ?? ""),
    [featuresMarkdown]
  );
  const hasMarkdownContent = Boolean(sanitizedMarkdown);

  return (
    <div className="mt-8">
      <Tabs className="mx-auto max-w-5xl" defaultValue="features">
        <TabsList className="grid h-14 w-full grid-cols-1 md:h-16">
          <TabsTrigger
            className="font-medium text-lg md:text-2xl"
            value="features"
          >
            商品詳情
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mx-auto mt-6" value="features">
          <div className="rounded-lg bg-white p-6 lg:px-24">
            {hasMarkdownContent ? (
              <div
                className="prose prose-gray prose-img:my-0 max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: sanitizedMarkdown }}
              />
            ) : (
              <div className="grid gap-3">
                {displayFeatures.map((feature, index) => (
                  <div
                    className="flex items-start space-x-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                    key={index}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {getFeatureIcon(feature)}
                    </div>
                    <span className="text-gray-700 leading-relaxed">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
