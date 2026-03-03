import { Decimal } from 'decimal.js';

export class PriceOutOfBandError extends Error {
    constructor(message = 'Price is outside the allowed NAV band (0.70x - 1.00x)') {
        super(message);
        this.name = 'PriceOutOfBandError';
    }
}

/**
 * Validates if a proposed listing price falls within the strictly regulated band.
 * The band is [NAV * 0.70, NAV * 1.00].
 * 
 * @param price The proposed selling price
 * @param nav The current Network Asset Value snapshot for the protocol
 * @throws {PriceOutOfBandError} if the price is out of bounds
 */
export function validatePriceBand(price: Decimal | string | number, nav: Decimal | string | number): void {
    const priceDec = new Decimal(price);
    const navDec = new Decimal(nav);

    // Band calculations
    const minPrice = navDec.mul(0.70);
    const maxPrice = navDec.mul(1.00);

    if (priceDec.lt(minPrice) || priceDec.gt(maxPrice)) {
        throw new PriceOutOfBandError(`Price ${priceDec.toFixed(8)} is outside allowed band [${minPrice.toFixed(8)} - ${maxPrice.toFixed(8)}]`);
    }
}

/**
 * Convenience function to fetch the raw bounds.
 */
export function getPriceBands(nav: Decimal | string | number): { minPrice: Decimal; maxPrice: Decimal } {
    const navDec = new Decimal(nav);
    return {
        minPrice: navDec.mul(0.70),
        maxPrice: navDec.mul(1.00),
    };
}
