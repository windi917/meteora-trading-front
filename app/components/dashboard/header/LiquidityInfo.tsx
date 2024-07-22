interface LiquidityInfoProps {
  poolPrice: number;
  totalLiquidity: number;
  feesEarned: number;
}

function LiquidityInfo({ poolPrice, totalLiquidity, feesEarned }: LiquidityInfoProps) {
  return (
    <div className="liquidity-info">
      <p className="font-l pb-2">Your Liquidity</p>
      <div className="flex pb-10" style={{ alignItems: 'center' }}>
        <p className="pr-4">Current Pool Price</p>
        <h2>{poolPrice} USDC/SOL</h2>
      </div>
      <div className="flex justify-between">
        <div className="total-liquidity">
          <p>Total Liquidity</p>
          <h2>${totalLiquidity}</h2>
        </div>
        <div className="fees-earned">
          <p>Fees Earned (Claimed)</p>
          <h2>${feesEarned}</h2>
        </div>
      </div>
    </div>
  );
};

export default LiquidityInfo;