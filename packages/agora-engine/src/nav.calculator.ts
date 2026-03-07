import { Decimal } from 'decimal.js';

/**
 * Core pure function to calculate the NAV of a protocol based on treasury and supply.
 * Precision is kept high internally (Decimal.js) to avoid mathematical decay.
 * 
 * @param treasury The total usable funds in the protocol's treasury (Decimal, string, number)
 * @param supply The total circulating supply of artifacts/licenses
 * @returns Decimal precision NAV
 * @throws {Error} if supply is strictly zero or negative
 */
export function calculateNAV(treasury: Decimal | string | number, supply: number): Decimal {
    if (supply <= 0) {
        throw new Error('CRITICAL: Cannot calculate NAV with zero or negative supply. Protocol has no circulating liquidity.');
    }

    const treasuryDec = new Decimal(treasury);

    if (treasuryDec.lt(0)) {
        throw new Error('CRITICAL: Treasury balance cannot be negative.');
    }

    return treasuryDec.div(supply);
}

/**
 * Core pure function to calculate the expected Early Exit penalty.
 * Early Exit gets penalised by defaults (15% penalty).
 * Formula: Price = NAV * (1 - 0.15)
 */
export function calculateEarlyExitPrice(nav: Decimal | string | number, penaltyRatio: number = 0.15): Decimal {
    if (penaltyRatio < 0 || penaltyRatio > 1) {
        throw new Error('Penalty ratio must be between 0 and 1');
    }

    const navDec = new Decimal(nav);
    const deduction = navDec.mul(penaltyRatio);
    return navDec.sub(deduction);
}
