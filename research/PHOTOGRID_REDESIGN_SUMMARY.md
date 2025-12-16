# PhotoGrid Component Redesign Summary

## Overview
Completely redesigned the PhotoGrid component to use background images with focal points, gradient overlays, and text overlays instead of simple Image components.

---

## ✅ New Features

### 1. Background Image with Focal Point
- Uses CSS `background-image` instead of `<Image>` component
- Supports custom focal point positioning via `focalPoint` prop
- Example: `{ x: '50%', y: '40%' }` - focus on top-center of image
- Hover effect: Scale up to 110% on hover

### 2. Gradient Overlay (Left to Right)
- Customizable gradient from left to right
- Props: `gradientFrom` and `gradientTo`
- Default: `rgba(0,0,0,0.6)` to `rgba(0,0,0,0)`
- Supports any CSS color with transparency

### 3. Text Overlay
- Optional text overlay with `text` prop
- Text alignment: `'left'` or `'right'` via `textAlign` prop
- Responsive typography (2xl → 3xl → 4xl)
- Drop shadow for better readability
- White text color for contrast

### 4. Configurable Aspect Ratio
- New `aspectRatio` prop (default: `'16/9'`)
- Can be any valid CSS aspect ratio: `'4/3'`, `'1/1'`, `'21/9'`, etc.

---

## 📋 Updated Interface

```typescript
interface Photo {
  src: string;                          // Image URL
  alt: string;                          // Alt text for accessibility
  text?: string;                        // Optional text overlay
  textAlign?: 'left' | 'right';        // Text alignment (default: 'right')
  focalPoint?: { x: string; y: string }; // Image focal point (default: '50% 50%')
  gradientFrom?: string;                // Left gradient color (default: 'rgba(0,0,0,0.6)')
  gradientTo?: string;                  // Right gradient color (default: 'rgba(0,0,0,0)')
}

interface Props {
  photos: Photo[];
  columns?: number;       // Grid columns (default: 2)
  gap?: string;          // Gap size (default: '8')
  aspectRatio?: string;  // Aspect ratio (default: '16/9')
}
```

---

## 🎨 Example Usage

### Before (Simple Images)
```astro
const warehousePhotos = [
  { src: '/images/about/warehouse-us.webp', alt: '美國倉庫' },
  { src: '/images/about/warehouse-taiwan.webp', alt: '台灣倉庫' },
];
```

### After (With Text Overlays & Gradients)
```astro
const warehousePhotos = [
  {
    src: '/images/about/warehouse-us.webp',
    alt: '美國倉庫',
    text: '自有美國倉庫',
    textAlign: 'left',
    focalPoint: { x: '50%', y: '50%' },
    gradientFrom: 'rgba(0,0,0,0.7)',    // Dark left
    gradientTo: 'rgba(0,0,0,0)',        // Transparent right
  },
  {
    src: '/images/about/warehouse-taiwan.webp',
    alt: '台灣倉庫',
    text: '自有台灣倉庫',
    textAlign: 'right',
    focalPoint: { x: '50%', y: '50%' },
    gradientFrom: 'rgba(0,0,0,0)',      // Transparent left
    gradientTo: 'rgba(0,0,0,0.7)',      // Dark right
  },
];

<PhotoGrid photos={warehousePhotos} columns={2} gap='6' aspectRatio='16/9' />
```

---

## 🎯 Design Pattern Examples

### Pattern 1: Alternating Text Alignment
```
┌─────────────────────┐  ┌─────────────────────┐
│ TEXT █              │  │              █ TEXT │
│      ▓              │  │              ▓      │
│      ░              │  │              ░      │
└─────────────────────┘  └─────────────────────┘
   Left-aligned              Right-aligned
   Dark → Light              Light → Dark
```

### Pattern 2: Focal Point Examples
- **Product in top-left**: `{ x: '25%', y: '25%' }`
- **Center focus**: `{ x: '50%', y: '50%' }`
- **Bottom-right subject**: `{ x: '75%', y: '75%' }`

### Pattern 3: Gradient Directions
- **Left dark → Right light**: Supports left-aligned text
- **Right dark → Left light**: Supports right-aligned text
- **Both dark**: For centered important text
- **Both transparent**: For high-contrast images

---

## 📐 Layout Changes in about.astro

### Warehouse Section
- ✅ Removed section title (now in photo text)
- ✅ Added text overlays: "自有美國倉庫", "自有台灣倉庫"
- ✅ Alternating text alignment (left → right)
- ✅ Alternating gradients for visual rhythm

### Logistics Section
- ✅ Removed section title (now in photo text)
- ✅ Added text overlays: "專業配送團隊", "快速到府服務"
- ✅ Custom focal points (40% and 60% vertical)
- ✅ Alternating text alignment (left → right)

---

## 🎨 Styling Features

### Responsive Design
- Mobile: Single column grid
- Tablet/Desktop: Multi-column grid
- Text size scales: `text-2xl` → `text-3xl` → `text-4xl`
- Padding adjusts: `p-8` → `p-12`

### Visual Effects
- **Hover**: Background scales to 110% with smooth transition (500ms)
- **Text Shadow**: Multi-layer shadows for readability
- **Gradient**: Smooth left-to-right transition
- **Rounded Corners**: `rounded-lg` for modern look

---

## 🔧 Technical Implementation

### Background Image Approach
```astro
<div
  class='absolute inset-0 bg-cover bg-no-repeat'
  style={`background-image: url('${photo.src}');
          background-position: ${focalX} ${focalY};`}
/>
```

**Why not `<Image>` component?**
- Better control over focal point positioning
- Easier gradient overlay implementation
- Simpler hover scale animations
- More flexible for various image ratios

### Layer Structure
1. **Background Image** (bottom layer) - with focal point
2. **Gradient Overlay** (middle layer) - left to right
3. **Text Overlay** (top layer) - with shadow and alignment

---

## 📁 Files Modified

### Updated
- `/apps/web/src/components/PhotoGrid.astro` - Complete redesign
- `/apps/web/src/pages/about.astro` - Updated photo data with new props

---

## ✨ Benefits

1. **Visual Impact**: Text overlays create stronger visual hierarchy
2. **Flexibility**: Focal points ensure important subjects stay visible
3. **Consistency**: Gradient patterns create visual rhythm
4. **Accessibility**: Alt text maintained, text shadows improve readability
5. **Performance**: CSS-only hover effects (no JavaScript needed)
6. **Responsive**: Scales beautifully across all screen sizes

---

## 🎯 Best Practices

### Focal Point Selection
- Analyze each image to identify the key subject
- Set focal point to ensure subject stays visible on all screen sizes
- Test on mobile to verify cropping works well

### Gradient Colors
- Use semi-transparent black for text readability
- Match gradient direction with text alignment
- Adjust opacity based on image brightness

### Text Content
- Keep text concise (2-4 words ideal)
- Use descriptive, benefit-oriented language
- Ensure high contrast with background

---

## 🚀 Ready to Use

The component is production-ready and fully integrated into the About page. Just add images and customize the focal points/gradients as needed!
