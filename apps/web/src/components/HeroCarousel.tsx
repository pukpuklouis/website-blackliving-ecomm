import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@blackliving/ui';
import { Button } from '@blackliving/ui';
import Autoplay from 'embla-carousel-autoplay';

interface HeroSlide {
  data: {
    image: string;
    title: string;
    subtitle: string;
    buttonText?: string;
    buttonLink?: string;
    order: number;
  };
}

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const plugin = React.useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full h-full"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {slides.map((slide, index) => (
          <CarouselItem key={index}>
            <div className="relative w-full h-screen">
              <img
                src={slide.data.image}
                alt={slide.data.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center text-white p-4">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-down">
                  {slide.data.title}
                </h1>
                <p className="text-xl md:text-2xl mb-8 opacity-90 animate-fade-in-up">
                  {slide.data.subtitle}
                </p>
                {slide.data.buttonText && slide.data.buttonLink && (
                  <a href={slide.data.buttonLink}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-primary border-white/80 text-white backdrop-blur-sm hover:bg-white/30 rounded-full px-8 py-6 text-lg"
                    >
                      {slide.data.buttonText}
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white bg-white/20 border-white/30 hover:bg-white/30" />
      <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white bg-white/20 border-white/30 hover:bg-white/30" />
    </Carousel>
  );
}
