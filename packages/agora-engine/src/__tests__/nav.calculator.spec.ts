import { Decimal } from 'decimal.js';
import { calculateNAV, calculateEarlyExitPrice } from '../nav.calculator';

describe('NAV Calculator', () => {

    describe('calculateNAV()', () => {
        it('should correctly calculate NAV for standard values', () => {
            const treasury = '1000000.00'; // $1M
            const supply = 10000;
            const nav = calculateNAV(treasury, supply);
            expect(nav.toString()).toBe('100'); // NAV should be 100
        });

        it('should handle high precision decimals correctly', () => {
            const treasury = '1000000.12345678';
            const supply = 3000;
            const nav = calculateNAV(treasury, supply);
            // Expected: ~333.3333744855933
            expect(nav.toFixed(8)).toBe('333.33337449');
        });

        it('should throw an error if supply is zero or negative', () => {
            expect(() => calculateNAV('100', 0)).toThrow('zero or negative supply');
            expect(() => calculateNAV('100', -10)).toThrow('zero or negative supply');
        });

        it('should throw an error if treasury is negative', () => {
            expect(() => calculateNAV('-100', 100)).toThrow('Treasury balance cannot be negative');
        });
    });

    describe('calculateEarlyExitPrice()', () => {
        it('should apply default 15% penalty correctly', () => {
            const nav = '100.00';
            const exitPrice = calculateEarlyExitPrice(nav); // Default 0.15
            expect(exitPrice.toString()).toBe('85');
        });

        it('should calculate custom penalty limits correctly', () => {
            const nav = '200.00';
            const exitPrice20Percent = calculateEarlyExitPrice(nav, 0.20);
            expect(exitPrice20Percent.toString()).toBe('160');

            const exitPrice0Percent = calculateEarlyExitPrice(nav, 0);
            expect(exitPrice0Percent.toString()).toBe('200');
        });

        it('should throw if penalty ratio is invalid', () => {
            expect(() => calculateEarlyExitPrice('100', -0.1)).toThrow();
            expect(() => calculateEarlyExitPrice('100', 1.5)).toThrow();
        });
    });
});
