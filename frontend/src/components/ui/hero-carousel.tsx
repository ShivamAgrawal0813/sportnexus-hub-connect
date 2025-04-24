
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselItem {
  imageUrl: string;
  title: string;
  description: string;
}

interface HeroCarouselProps {
  items: CarouselItem[];
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

export function HeroCarousel({
  items,
  autoPlay = true,
  interval = 5000,
  className,
}: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // Clear interval on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Set up autoplay
  useEffect(() => {
    if (autoPlay) {
      intervalRef.current = window.setInterval(() => {
        setActiveIndex((current) => (current + 1) % items.length);
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [autoPlay, interval, items.length]);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
    
    // Reset interval when manually changing slides
    if (autoPlay && intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => {
        setActiveIndex((current) => (current + 1) % items.length);
      }, interval);
    }
  };

  const goToPrevSlide = () => {
    const newIndex = activeIndex === 0 ? items.length - 1 : activeIndex - 1;
    goToSlide(newIndex);
  };

  const goToNextSlide = () => {
    const newIndex = (activeIndex + 1) % items.length;
    goToSlide(newIndex);
  };

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      <div className="relative h-full w-full">
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 h-full w-full transition-opacity duration-1000",
              activeIndex === index ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${item.imageUrl})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40" />
            </div>
            <div className="relative h-full flex flex-col justify-center items-center text-center p-6 md:p-10 text-white">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">{item.title}</h2>
              <p className="text-lg md:text-xl max-w-2xl">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full"
        onClick={goToPrevSlide}
      >
        <ChevronLeft className="h-8 w-8" />
        <span className="sr-only">Previous slide</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full"
        onClick={goToNextSlide}
      >
        <ChevronRight className="h-8 w-8" />
        <span className="sr-only">Next slide</span>
      </Button>

      {/* Indicator dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {items.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-3 h-3 rounded-full transition-colors",
              activeIndex === index ? "bg-white" : "bg-white/50"
            )}
            onClick={() => goToSlide(index)}
          >
            <span className="sr-only">Go to slide {index + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
