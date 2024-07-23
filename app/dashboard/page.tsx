'use client'

import React, { useState, useEffect, useCallback, useContext } from "react";
import LiquidityInfo from '../components/dashboard/header/LiquidityInfo';
import Balances from '../components/dashboard/header/Balances';
import UnclaimedFees from '../components/dashboard/header/UnclaimedFees';
import Position from '../components/dashboard/position/Position';
import { getAllPair } from '../api/api'

export default function Dashboard() {

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchPairs = async () => {
      const pairs = await getAllPair();
      console.log("PAIRS", pairs);

      const sol_usdc = pairs.response.find(e => e.name === 'SOL-USDC' || e.name === 'USDC-SOL')
      console.log("SOL-USDC : ", sol_usdc)
    }

    fetchPairs();
  }, [])

  const poolPrice = 159.05;
  const totalLiquidity = 0.797992;
  const feesEarned = 0.0;
  const solBalance = 0.002439;
  const usdcBalance = 0.410671;
  const solFee = 0.00000122;
  const usdcFee = 0.000177;

  return (
    <div className="App">
      <LiquidityInfo poolPrice={poolPrice} totalLiquidity={totalLiquidity} feesEarned={feesEarned} />
      <div className="flex justify-between">
        <Balances solBalance={solBalance} usdcBalance={usdcBalance} />
        <UnclaimedFees solFee={solFee} usdcFee={usdcFee} />
      </div>

      <Position />
    </div>
  );
};