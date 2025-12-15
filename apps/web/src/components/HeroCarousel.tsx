import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@blackliving/ui";
import Autoplay from "embla-carousel-autoplay";
import React from "react";

interface HeroSlide {
  data: {
    image: string;
    title: string;
    subtitle: string;
    logo?: string;
    buttonText: string;
    buttonLink: string;
    showContent: boolean;
    order: number;
  };
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  aspectRatio?: "horizontal" | "vertical" | "full";
}

export default function HeroCarousel({
  slides,
  aspectRatio,
}: HeroCarouselProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  return (
    <Carousel
      className="h-full w-full"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
      plugins={[plugin.current]}
    >
      <CarouselContent>
        {slides.map((slide, index) => (
          <CarouselItem key={index}>
            <div
              className={`relative w-full ${aspectRatio === "vertical" ? "aspect-[256/341]" : aspectRatio === "horizontal" ? "aspect-[512/213]" : "h-[calc(100dvh-8rem)]"} `}
            >
              <img
                alt={slide.data.title}
                className="h-full w-full object-contain"
                src={slide.data.image}
              />
              {/*overlay gradient*/}
              {/*<div className="absolute inset-0 bg-black/40"></div>*/}
              {slide.data.showContent && (
                <div className="absolute inset-0 z-10 flex flex-col items-start justify-center p-4 px-24 text-center text-white">
                  <img
                    alt={slide.data.title}
                    className="mb-6 h-auto w-72 animate-fade-in-down"
                    src={slide.data.logo}
                  />
                  <h1 className="mb-6 animate-fade-in-down font-medium text-5xl md:text-5xl">
                    {slide.data.title}
                  </h1>
                  <p className="mb-6 animate-fade-in-up text-lg">
                    {slide.data.subtitle}
                  </p>
                </div>
              )}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-translate-y-1/2 absolute top-1/2 left-4 z-20 border-white/30 bg-white/20 text-white hover:bg-white/30" />
      <CarouselNext className="-translate-y-1/2 absolute top-1/2 right-4 z-20 border-white/30 bg-white/20 text-white hover:bg-white/30" />
    </Carousel>
  );
}
