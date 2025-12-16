import { Card, CardContent, CardHeader, CardTitle } from "@blackliving/ui";
import ImageIcon from "@lucide/react/image";
import { ImageUpload } from "../ImageUpload";

type ProductImagesProps = {
  images: string[]; // formData.images
  error?: string; // formErrors.images
  hasAtLeastOneImage: boolean;
  onChange: (images: string[]) => void;
};

export function ProductImages({
  images,
  error,
  hasAtLeastOneImage,
  onChange,
}: ProductImagesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          產品圖片
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ImageUpload
          emptyHint={
            hasAtLeastOneImage ? undefined : "儲存前請至少上傳一張產品圖片。"
          }
          error={error}
          folder="products"
          onChange={onChange}
          value={images}
        />
      </CardContent>
    </Card>
  );
}
