# About Page Images

This directory contains all images used on the About page (`/about`).

## Required Images

Please add the following images to this directory:

1. **beautyrest-black-banner.webp** - Beautyrest BLACK brand badge banner
2. **warehouse-us.webp** - US warehouse facility photo
3. **warehouse-taiwan.webp** - Taiwan warehouse facility photo
4. **delivery-truck-1.webp** - Delivery truck photo #1
5. **delivery-truck-2.webp** - Delivery truck photo #2
6. **lifestyle-bedroom.webp** - Lifestyle bedroom scene photo

## Image Specifications

- **Format**: WebP (for optimal performance)
- **Recommended dimensions**:
  - Banner: 1920x820px (21:9 aspect ratio)
  - Warehouse/Logistics: 800x600px (4:3 aspect ratio)
  - Lifestyle: 1600x900px (16:9 aspect ratio)
- **Optimization**: Compress images before uploading

## Usage

These images are referenced in `/apps/web/src/pages/about.astro` and rendered using the following components:

- `ImageBanner.astro` - For banner images
- `PhotoGrid.astro` - For photo grid layouts
