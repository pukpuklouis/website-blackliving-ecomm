import { describe, it, expect } from 'vitest';
import { calculateShippingFee, type LogisticSettings, type ShippingAddress } from './cartStore';

describe('calculateShippingFee', () => {
    const settings: LogisticSettings = {
        baseFee: 200,
        freeShippingThreshold: 3000,
        remoteZones: [
            { id: '1', city: '花蓮縣', surcharge: 100 },
            { id: '2', city: '屏東縣', district: '琉球鄉', surcharge: 200 },
        ],
    };

    it('should return base fee when subtotal is below threshold', () => {
        const fee = calculateShippingFee(1000, settings, null);
        expect(fee).toBe(200);
    });

    it('should return 0 when subtotal is above threshold', () => {
        const fee = calculateShippingFee(3500, settings, null);
        expect(fee).toBe(0);
    });

    it('should add surcharge for remote city', () => {
        const address: ShippingAddress = {
            name: 'Test',
            phone: '0912345678',
            address: 'Test Addr',
            city: '花蓮縣',
            district: '花蓮市',
            postalCode: '970',
        };
        const fee = calculateShippingFee(1000, settings, address);
        expect(fee).toBe(200 + 100); // Base + Surcharge
    });

    it('should add surcharge for remote city even if free shipping', () => {
        const address: ShippingAddress = {
            name: 'Test',
            phone: '0912345678',
            address: 'Test Addr',
            city: '花蓮縣',
            district: '花蓮市',
            postalCode: '970',
        };
        const fee = calculateShippingFee(3500, settings, address);
        expect(fee).toBe(0 + 100); // Free Base + Surcharge
    });

    it('should add surcharge for specific district', () => {
        const address: ShippingAddress = {
            name: 'Test',
            phone: '0912345678',
            address: 'Test Addr',
            city: '屏東縣',
            district: '琉球鄉',
            postalCode: '929',
        };
        const fee = calculateShippingFee(1000, settings, address);
        expect(fee).toBe(200 + 200);
    });

    it('should NOT add surcharge for non-remote district in same city', () => {
        const address: ShippingAddress = {
            name: 'Test',
            phone: '0912345678',
            address: 'Test Addr',
            city: '屏東縣',
            district: '屏東市',
            postalCode: '900',
        };
        const fee = calculateShippingFee(1000, settings, address);
        expect(fee).toBe(200);
    });
});
