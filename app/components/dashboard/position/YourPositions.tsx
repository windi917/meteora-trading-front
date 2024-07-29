import React, { useState, useEffect } from 'react';
import { Button } from "@mui/material";
import Balances from "../header/Balances";
import UnclaimedFees from "../header/UnclaimedFees";
import ToggleButton from "../../ToggleButton";
import AddPosition from "./AddPosition";
import Withdraw from '../WithdrawComponent';
import { MTActiveBin, MTPosition, MTPair } from '@/app/config';

interface PositionProps {
  positions: MTPosition[] | undefined;
  activeBin: MTActiveBin | undefined;
  mtPair: MTPair | undefined;
  refresh: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

function getLiquidity(position: MTPosition, activeBin: MTActiveBin) {
  let poolPrice: number = activeBin.pricePerToken;
  let xBalance: number = position.totalXAmount;
  let yBalance: number = position.totalYAmount;
  let totalLiquidity: number = Number(xBalance) * poolPrice + Number(yBalance);

  return `${totalLiquidity.toFixed(2)}`
}

function YourPositions({ positions, activeBin, mtPair, refresh, setRefresh }: PositionProps) {
  // Initialize state
  const [liquidities, setLiquidities] = useState(positions);

  const handleClick = (address: string) => {
    const updatedLiquidities = liquidities?.map(one => {
      if (one.address === address) {
        return {
          ...one,
          visible: !one.visible,
        };
      }
      return one;
    });

    setLiquidities(updatedLiquidities);
  };

  const handleToggle = (address: string, view: 'add' | 'withdraw') => {
    const updatedLiquidities = liquidities?.map(one => {
      if (one.address === address) {
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
      {liquidities?.map((e) => (
        <div className="position-card mb-8" key={e.address}>
          <div className="p-8" onClick={() => handleClick(e.address)}>
            <div className="flex justify-between ">
              <p className="w-3/5">
                {e.positionBinData && e.positionBinData.length > 0 ? (
                  <>
                    <span>{Number(e.positionBinData[0].pricePerToken).toFixed(2)}</span>
                    <span>-</span>
                    <span>{Number(e.positionBinData[e.positionBinData.length - 1].pricePerToken).toFixed(2)}</span>
                  </>

                ) : 0 - 0}
              </p>
              <p className="w-1/5 text-center">0.44%</p>
              <p className="w-1/5 text-right">{activeBin ? getLiquidity(e, activeBin) : '$0'}</p>
              {e.visible ? (
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
                  {/* <Button variant="contained" color="primary">Claim Fees</Button> */}
                </div>
                <div className="flex justify-between">
                  <Balances solBalance={Number(Number(e.totalXAmount).toFixed(6))} usdcBalance={Number(Number(e.totalYAmount).toFixed(6))} />
                  <UnclaimedFees solFee={Number(Number(e.feeX).toFixed(6))} usdcFee={Number(Number(e.totalXAmount).toFixed(6))} />
                </div>
              </div>
              <ToggleButton
                view={e.view}
                onToggle={(view) => handleToggle(e.address, view)}
              />
              {e.view === 'withdraw' ? (
                <Withdraw position={e} mtPair={mtPair} activeBin={activeBin} refresh={refresh} setRefresh={setRefresh} />
              ) : (
                <AddPosition position={e} mtPair={mtPair} activeBin={activeBin} refresh={refresh} setRefresh={setRefresh} />
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default YourPositions;
