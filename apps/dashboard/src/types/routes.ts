export interface RouteResult {
  provider: string; // Ej: "UniswapV3", "Bridge", "Curve"
  label: string; // Ej: "Uniswap V3 0.3%", "Across", "Curve"
  fee?: number;
  output: bigint;
  ok: boolean;
  error?: unknown;
}