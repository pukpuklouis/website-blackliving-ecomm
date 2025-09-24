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
    logo?: string;
    buttonText: string;
    buttonLink: string;
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
            <div className="relative w-full h-[calc(100dvh-8rem)]">
              <img
                src={slide.data.image}
                alt={slide.data.title}
                className="w-full h-full object-cover"
              />
              {/*overlay gradient*/}
              {/*<div className="absolute inset-0 bg-black/40"></div>*/}
              <div className="absolute inset-0 z-10 flex flex-col items-start justify-center text-center text-white p-4 px-24">
                <img
                  src={slide.data.logo}
                  alt={slide.data.title}
                  className="w-72 h-auto mb-6 animate-fade-in-down"
                />
                <h1 className="text-5xl md:text-5xl font-medium mb-6 animate-fade-in-down">
                  {slide.data.title}
                </h1>
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
