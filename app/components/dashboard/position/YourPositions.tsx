import React, { useState } from 'react';
import { Button } from "@mui/material";
import Balances from "../header/Balances";
import UnclaimedFees from "../header/UnclaimedFees";
import ToggleButton from "../../ToggleButton";
import AddPosition from "./AddPosition";
import Withdraw from '../WithdrawComponent';

interface LiquidityData {
  id: number;
  name: string;
  visible: boolean;
  view: 'add' | 'withdraw';
}

const liquidityData: LiquidityData[] = [
  {
    id: 1,
    name: 'liquidity1',
    visible: false,
    view: 'add',
  },
  {
    id: 2,
    name: 'liquidity2',
    visible: false,
    view: 'add',
  },
  {
    id: 3,
    name: 'liquidity3',
    visible: false,
    view: 'add',
  }
];

function YourPositions() {
  const [liquidities, setLiquidities] = useState<LiquidityData[]>(liquidityData);

  const handleClick = (id: number) => {
    const updatedLiquidities = liquidities.map(one => {
      if (one.id === id) {
        return {
          ...one,
          visible: !one.visible,
        };
      }
      return one;
    });

    setLiquidities(updatedLiquidities);
  };

  const handleToggle = (id: number, view: 'add' | 'withdraw') => {
    const updatedLiquidities = liquidities.map(one => {
      if (one.id === id) {
        return {
          ...one,
          view,
        };
      }
      return one;
    });

    setLiquidities(updatedLiquidities);
  };

  return (
    <div className="your-position">
      <div className="flex justify-between p-4">
        <p className="w-3/5">Price Range</p>
        <p className="w-1/5 text-center">24hr Fee/TVL</p>
        <p className="w-1/5 text-right">Your Liquidity</p>
      </div>
      {liquidities.map((e) => (
        <div className="position-card mb-8" key={e.id}>
          <div className="p-8" onClick={() => handleClick(e.id)}>
            <div className="flex justify-between ">
              <p className="w-3/5">150.64-167.96</p>
              <p className="w-1/5 text-center">0.44%</p>
              <p className="w-1/5 text-right">$0.8</p>
              { e.visible ? (
                <img src="/collapse.png" className="w-5 h-5 ml-6" alt="Collapse" />
              ) : (
                <img src="/drop.png" className="w-5 h-5 ml-6" alt="Drop" />
              )}
            </div>
          </div>
          {e.visible && (
            <>
              <div className="position-card-body p-8">
                <div className="flex justify-between">
                  <p className="font-l">Position Liquidity</p>
                  <Button variant="contained" color="primary">Claim Fees</Button>
                </div>
                <div className="flex justify-between">
                  <Balances solBalance={0.001131} usdcBalance={0.621883} />
                  <UnclaimedFees solFee={0.00001367} usdcFee={0.002228} />
                </div>
              </div>
              <ToggleButton
                view={e.view}
                onToggle={(view) => handleToggle(e.id, view)}
              />
              {e.view === 'withdraw' ? (
                <Withdraw />
              ) : (
                <AddPosition solBalance={1.732} usdcBalance={79.895} />
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default YourPositions;
