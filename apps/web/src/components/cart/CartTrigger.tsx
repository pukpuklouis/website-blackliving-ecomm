import { CartIcon } from "@blackliving/ui";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { useCartStore } from "../../stores/cartStore";

type CartTriggerProps = {
  className?: string;
};

const CartTrigger: FC<CartTriggerProps> = ({ className }) => {
  const { openCart } = useCartStore();
  const itemCount = Number(useCartStore((state) => state.getItemCount())) || 0;

  // Prevent hydration mismatch by only showing badge after client-side hydration
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const buttonClass =
    className ||
    "text-black text-sm lg:text-base font-normal hover:text-gray-600 transition-colors flex items-center gap-1";

  return (
    <button
      aria-label="購物車"
      className={buttonClass}
      onClick={openCart}
      type="button"
    >
      <div className="relative">
        <CartIcon />
        {/** biome-ignore lint/nursery/noLeakedRender: itemCount is guaranteed to be a number after Number() conversion */}
        {isHydrated && itemCount > 0 ? (
          <span className="-top-2 -right-2 absolute flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1.5 py-0.5 font-bold text-[10px] text-white">
            {itemCount > 99 ? "99+" : String(itemCount)}
          </span>
        ) : null}
      </div>
      <span>購物車</span>
    </button>
  );
};

export default CartTrigger;
