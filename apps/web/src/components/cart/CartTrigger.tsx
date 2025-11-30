import type { FC } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { CartIcon } from '@blackliving/ui';

const CartTrigger: FC = () => {
    const { openCart, itemCount } = useCartStore();

    return (
        <button
            onClick={openCart}
            className="text-black text-sm lg:text-base font-normal hover:text-gray-600 transition-colors flex items-center gap-1"
            aria-label="購物車"
        >
            <div className="relative">
                <CartIcon />
                {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white">
                        {itemCount > 99 ? '99+' : itemCount}
                    </span>
                )}
            </div>
            <span>購物車</span>
        </button>
    );
};

export default CartTrigger;
