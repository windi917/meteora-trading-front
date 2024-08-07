import { MeteoraContext } from "@/app/Provider/MeteoraProvider";
import { toDecimalString } from "@/app/utiles";
import { useContext } from "react";

function LiquidityInfo() {
  const { mtPair, positionLiquidities } = useContext(MeteoraContext)

  let poolPrice: number = mtPair ? mtPair.current_price : 0;
  let totalLiquidity: number = positionLiquidities ? positionLiquidities.length ? positionLiquidities.map(e => e.liquidity).reduce((acc, value) => Number(acc) + Number(value)) : 0 : 0;
  let feesEarned: number = positionLiquidities ? positionLiquidities.length ? positionLiquidities.map(e => e.feeEarned).reduce((acc, value) => Number(acc) + Number(value)) : 0 : 0;

  return (
    <div className="liquidity-info">
      <p className="font-l pb-2">Your Liquidity</p>
      <div className="flex pb-10" style={{ alignItems: 'center' }}>
        <p className="pr-4">Current Pool Price</p>
        <h2>{toDecimalString(poolPrice)} {mtPair ? mtPair.name.split('-')[1] : ''}/{mtPair ? mtPair.name.split('-')[0] : ''}</h2>
      </div>
      <div className="flex justify-between">
        <div className="total-liquidity">
          <p>Total Liquidity</p>
          <h2>${toDecimalString(totalLiquidity)}</h2>
        </div>
        <div className="fees-earned">
          <p>Fees Earned (Claimed)</p>
          <h2>${toDecimalString(feesEarned)}</h2>
        </div>
      </div>
    </div>
  );
};

export default LiquidityInfo;