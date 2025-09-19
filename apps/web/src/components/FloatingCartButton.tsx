import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useCartStore } from '../stores/cartStore';
import { Button } from '@blackliving/ui';
import { Badge } from '@blackliving/ui';
import MiniCart from './MiniCart';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@blackliving/ui';

interface FloatingCartButtonProps {
  onCheckout?: () => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showOnMobile?: boolean;
  hideWhenEmpty?: boolean;
}

const FloatingCartButton: FC<FloatingCartButtonProps> = ({
  onCheckout,
  className = '',
  position = 'bottom-right',
  showOnMobile = true,
  hideWhenEmpty = false,
}) => {
  const { itemCount, items } = useCartStore();
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [hasNewItems, setHasNewItems] = useState(false);

  // Handle scroll to hide/show button
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show/hide based on scroll direction
      if (currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 200) {
        // Scrolling down - hide
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Animate when new items are added
  useEffect(() => {
    if (itemCount > 0) {
      setHasNewItems(true);
      const timer = setTimeout(() => setHasNewItems(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [itemCount]);

  // Don't render if hiding when empty and cart is empty
  if (hideWhenEmpty && itemCount === 0) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const handleButtonClick = () => {
    setIsMiniCartOpen(true);
    setHasNewItems(false);
  };

  const handleCheckout = () => {
    // Navigate to checkout page
    onCheckout?.();
  };

  return (
    <>
      {/* Floating Cart Button */}
      <div
        className={cn(
          'fixed z-40 transition-all duration-300 ease-out',
          positionClasses[position],
          {
            'translate-y-0 opacity-100': isVisible,
            'translate-y-16 opacity-0': !isVisible,
            'hidden md:block': !showOnMobile,
          },
          className
        )}
      >
        <Button
          onClick={handleButtonClick}
          className={cn(
            'h-14 w-14 rounded-full shadow-2xl bg-black hover:bg-gray-800 text-white',
            'transform transition-all duration-200 hover:scale-110',
            'border-2 border-white',
            {
              'animate-pulse bg-blue-600 hover:bg-blue-700': hasNewItems,
              'ring-4 ring-blue-200 ring-opacity-60': hasNewItems,
            }
          )}
          aria-label={`購物車 - ${itemCount} 件商品`}
        >
          <div className="relative">
            <ShoppingCart className="h-6 w-6" />
            {itemCount > 0 && (
              <Badge
                variant="destructive"
                className={cn(
                  'absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center',
                  'text-xs font-bold bg-red-500 text-white border-2 border-white',
                  'animate-bounce' // Always animate for visibility
                )}
              >
                {itemCount > 99 ? '99+' : itemCount}
              </Badge>
            )}
          </div>
        </Button>

        {/* Quick Preview Tooltip */}
        {itemCount > 0 && (
          <div
            className={cn(
              'absolute mb-2 p-2 bg-black text-white text-xs rounded-lg shadow-lg',
              'opacity-0 pointer-events-none transition-opacity duration-200',
              'whitespace-nowrap',
              {
                'bottom-full right-0': position.includes('bottom'),
                'top-full right-0': position.includes('top'),
                'right-full top-0': position.includes('right'),
                'left-full top-0': position.includes('left'),
              },
              'group-hover:opacity-100'
            )}
          >
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-3 w-3" />
              <span>{itemCount} 件商品</span>
            </div>

            {/* Tooltip Arrow */}
            <div
              className={cn('absolute w-2 h-2 bg-black rotate-45', {
                'top-full left-1/2 -translate-x-1/2 -mt-1': position.includes('bottom'),
                'bottom-full left-1/2 -translate-x-1/2 -mb-1': position.includes('top'),
                'left-full top-1/2 -translate-y-1/2 -ml-1': position.includes('right'),
                'right-full top-1/2 -translate-y-1/2 -mr-1': position.includes('left'),
              })}
            />
          </div>
        )}
      </div>

      {/* Mini Cart Drawer */}
      <MiniCart
        isOpen={isMiniCartOpen}
        onClose={() => setIsMiniCartOpen(false)}
        onCheckout={handleCheckout}
      />
    </>
  );
};

export default FloatingCartButton;
