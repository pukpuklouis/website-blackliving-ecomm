import { type FC, useEffect } from 'react';
import { useCartStore } from '../../stores/cartStore';
import MiniCart from '../MiniCart';

const CartDrawer: FC = () => {
    const { isCartOpen, closeCart, fetchLogisticSettings } = useCartStore();

    useEffect(() => {
        fetchLogisticSettings();
    }, [fetchLogisticSettings]);

    const handleCheckout = () => {
        window.location.href = '/checkout';
    };

    return (
        <MiniCart
            isOpen={isCartOpen}
            onClose={closeCart}
            onCheckout={handleCheckout}
        />
    );
};

export default CartDrawer;
