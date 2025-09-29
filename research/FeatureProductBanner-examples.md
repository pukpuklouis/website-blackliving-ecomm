# FeatureProductBanner Usage Examples

## Basic Usage

```astro
<!-- Simple banner with default gradient -->
<FeatureProductBanner 
  imageUrl="/banner-image.webp"
  alt="Product banner"
/>
```

## Left-to-Right Gradient with Left Text

```astro
<FeatureProductBanner 
  imageUrl="/mattress-banner.webp"
  alt="Simmons Black Label"
  gradientDirection="left-to-right"
  gradientFromColor="transparent" 
  gradientToColor="black"
  gradientOpacity={0.4}
  textPosition="left"
  textTitle="頂級席夢思床墊"
  textDescription="享受極致舒適睡眠體驗"
  height="lg"
/>
```

## Right-to-Left Gradient with Right Text + Image Overlay

```astro
<FeatureProductBanner 
  imageUrl="/bedroom-setting.webp"
  alt="Luxury bedroom"
  gradientDirection="right-to-left"
  gradientFromColor="transparent"
  gradientToColor="purple"
  gradientOpacity={0.3}
  textPosition="right"
  textTitle="限時特惠"
  textDescription="立即搶購頂級床墊"
  overlayImageUrl="/logo-white.webp"
  overlayImageAlt="Brand logo"
  overlayImagePosition="left"
  overlayImageSize="md"
  href="/products/simmons-black"
/>
```

## Top-to-Bottom Gradient with Center Text

```astro
<FeatureProductBanner 
  imageUrl="/hero-image.webp"
  alt="Black Living"
  gradientDirection="top-to-bottom"
  gradientFromColor="black"
  gradientToColor="transparent"
  gradientOpacity={0.5}
  textPosition="center"
  textTitle="Black Living 黑哥家居"
  textDescription="台灣頂級床墊專門店"
  height="xl"
  textClassName="text-center"
/>
```

## Product Showcase with Image Overlay

```astro
<FeatureProductBanner 
  imageUrl="/product-lifestyle.webp"
  alt="Product showcase"
  gradientDirection="left-to-right"
  gradientFromColor="transparent"
  gradientToColor="gray"
  gradientOpacity={0.6}
  overlayImageUrl="/product-hero.webp"
  overlayImageAlt="Featured mattress"
  overlayImagePosition="right"
  overlayImageSize="lg"
  textPosition="left"
  textTitle="新品上市"
  textDescription="美國進口頂級床墊"
  hoverEffect={true}
/>
```

## Props Reference

### Background Image
- `imageUrl`: Image source URL
- `alt`: Alt text for accessibility
- `height`: 'sm' | 'md' | 'lg' | 'xl' - Banner height

### Gradient Overlay
- `gradientDirection`: 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top'
- `gradientFromColor`: Start color ('transparent', 'black', 'white', 'gray', etc.)
- `gradientToColor`: End color
- `gradientOpacity`: Number (0-1) for overlay opacity

### Text Overlay
- `textPosition`: 'left' | 'right' | 'center' - Text positioning
- `textTitle`: Main headline text
- `textDescription`: Subtitle/description text
- `textClassName`: Additional CSS classes for text styling

### Image Overlay
- `overlayImageUrl`: Overlay image source
- `overlayImageAlt`: Alt text for overlay image
- `overlayImagePosition`: 'left' | 'right' - Image positioning
- `overlayImageSize`: 'sm' | 'md' | 'lg' - Image size

### Interaction
- `href`: Makes banner clickable with link
- `hoverEffect`: Enable/disable hover animations