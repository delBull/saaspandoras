import { Decimal } from 'decimal.js';
import { validatePriceBand, getPriceBands, PriceOutOfBandError } from '../price.validator';

describe('Price Validator', () => {
    const nav = '1.50'; // 1.50 USD NAV

    it('should calculate correct price bands (0.70x - 1.00x)', () => {
        const { minPrice, maxPrice } = getPriceBands(nav);
        expect(minPrice.toString()).toBe('1.05'); // 1.50 * 0.70
        expect(maxPrice.toString()).toBe('1.5');  // 1.50 * 1.00
    });

    it('should allow prices strictly within the band', () => {
        expect(() => validatePriceBand('1.25', nav)).not.toThrow();
        expect(() => validatePriceBand('1.05', nav)).not.toThrow(); // Exactly lower bound
        expect(() => validatePriceBand('1.50', nav)).not.toThrow(); // Exactly upper bound
    });

    it('should reject prices below the band', () => {
        expect(() => validatePriceBand('1.00', nav)).toThrow(PriceOutOfBandError);
        expect(() => validatePriceBand('0.50', nav)).toThrow(PriceOutOfBandError);
    });

    it('should reject prices above the band', () => {
        expect(() => validatePriceBand('1.51', nav)).toThrow(PriceOutOfBandError);
        expect(() => validatePriceBand('2.00', nav)).toThrow(PriceOutOfBandError);
    });
});
