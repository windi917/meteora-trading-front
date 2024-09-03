import { MeteoraContext } from "@/app/Provider/MeteoraProvider";
import { toDecimalString } from "@/app/utiles";
import { useContext } from "react";

function LiquidityInfo() {
  const { mtPair, positionLiquidities } = useContext(MeteoraContext);

  let poolPrice: number = mtPair ? mtPair.current_price : 0;
  let totalLiquidity: number = positionLiquidities
    ? positionLiquidities.length
      ? positionLiquidities.map((e) => e.liquidity).reduce((acc, value) => Number(acc) + Number(value))
      : 0
    : 0;
  let feesEarned: number = positionLiquidities
    ? positionLiquidities.length
      ? positionLiquidities.map((e) => e.feeEarned).reduce((acc, value) => Number(acc) + Number(value))
      : 0
    : 0;

  return (
    <div className="p-4 lg:p-6 border-b border-gray-300">
      <p className="text-lg lg:text-xl font-semibold pb-8">Your Liquidity</p>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6">
        <p className="text-sm lg:text-base mb-2 md:mb-0">Current Pool Price</p>
        <h2 className="text-lg lg:text-xl font-bold">
          {toDecimalString(poolPrice)} {mtPair ? mtPair.name.split('-')[1] : ''}/{mtPair ? mtPair.name.split('-')[0] : ''}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="total-liquidity flex flex-col">
          <p className="text-sm lg:text-base">Total Liquidity</p>
          <h2 className="text-lg lg:text-xl font-bold">${toDecimalString(totalLiquidity)}</h2>
        </div>
        <div className="fees-earned flex flex-col">
          <p className="text-sm lg:text-base">Fees Earned (Claimed)</p>
          <h2 className="text-lg lg:text-xl font-bold">${toDecimalString(feesEarned)}</h2>
        </div>
      </div>
    </div>
  );
}

export default LiquidityInfo;
