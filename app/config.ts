import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export const BACKEND_API_URL = 'https://b.dayprotocol.ai';
export const METEORA_API_URL = 'https://dlmm-api.meteora.ag'
export const JUPITER_API_URL = 'https://price.jup.ag/v6'

export const NETWORK = 'devnet'
export const ADMIN_WALLET_ADDRESS = new PublicKey('3BWcH5wSKXkydJg3giuLesrqkSSgw4jDo16wEWnhoS65');

export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export const SOL_DECIMALS = 9;
export const USDC_DECIMALS = 6;

export const DEPOSIT_SOLANA = 1;
export const DEPOSIT_USDC = 2;

export interface MTPair {
  address: string,
  name: string,
  mint_x: string,
  mint_y: string,
  reserve_x: string,
  reserve_y: string,
  reserve_x_amount: number,
  reserve_y_amount: number,
  bin_step: number
  base_fee_percentage: number,
  max_fee_percentage: number,
  protocol_fee_percentage: number,
  liquidity: number,
  fees_24h: number,
  today_fees: number,
  trade_volume_24h: number,
  cumulative_trade_volume: number,
  cumulative_fee_volume: number,
  current_price: number,
  apr: number,
  apy: number,
  farm_apr: number,
  farm_apy: number,
  hide: number
}

export interface MTBin {
  binId: number,
  binLiquidity: number,
  binXAmount: number,
  binYAmount: number,
  positionLiquidity: number,
  positionXAmount: number,
  positionYAmount: number,
  price: number,
  pricePerToken: number
}

export interface MTPosition {
  address: string,
  feeX: number,
  feeY: number,
  lowerBinId: number,
  positionBinData: MTBin[],
  rewardOne: number,
  rewardTwo: number,
  totalClaimedFeeXAmount: number,
  totalClaimedFeeYAmount: number,
  totalXAmount: number,
  totalYAmount: number,
  upperBinId: number,
  visible: boolean,
  view: "add" | "withdraw",
}

export interface MTActiveBin {
  binId: number,
  price: number,
  pricePerToken: number,
  supply: BN,
  xAmount: BN,
  yAmount: BN
}