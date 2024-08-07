import React, { useState, useEffect, useContext } from 'react';
import { Button } from "@mui/material";
import Balances from "../header/Balances";
import UnclaimedFees from "../header/UnclaimedFees";
import ToggleButton from "../../ToggleButton";
import AddPosition from "./AddPosition";
import Withdraw from '../WithdrawComponent';
import { claimFee, getTokenPrice } from '@/app/api/api';
import { JwtTokenContext } from '@/app/Provider/JWTTokenProvider';
import { Oval } from "react-loader-spinner";
import { toast } from 'react-toastify';
import { MeteoraContext } from '@/app/Provider/MeteoraProvider';
import { toDecimalString } from '@/app/utiles';

interface Liquidity {
  address: string;
  liquidity: number;
}

function YourPositions() {
  // Initialize state
  const { jwtToken } = useContext(JwtTokenContext);
  const { positions, setPositions, mtPair, activeBin } = useContext(MeteoraContext);
  const [loading, setLoading] = useState(false);
  const [positionLiquidities, setPositionLiquidities] = useState<Liquidity[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!mtPair)
        return;

      const symbols = mtPair.name.split('-');
      if (symbols.length === 2) {
        const xSymbol = symbols[0];
        const ySymbol = symbols[1];

        const xRes = await getTokenPrice(xSymbol);
        const yRes = await getTokenPrice(ySymbol);

        if (!xRes.success || !yRes.success) {
          toast.error("Get Token Price error!");
          return;
        }

        const xPriceData = xRes.response.data[xSymbol];
        const yPriceData = yRes.response.data[ySymbol];

        if (!xPriceData || !yPriceData) {
          return;
        }

        if (typeof xPriceData.price === 'undefined' || typeof yPriceData.price === 'undefined') {
          return;
        }

        if (!positions)
          return;

        const data = positions.map((e) => ({
          'address': e.address,
          'liquidity': e.totalXAmount * xPriceData.price + e.totalYAmount * yPriceData.price
        }))

        setPositionLiquidities(data);
      }
    }

    fetchData();
  }, [positions, mtPair]);

  const handleClick = (address: string) => {
    const updatedPositions = positions?.map(one => {
      if (one.address === address) {
        return {
          ...one,
          visible: !one.visible,
        };
      }
      return one;
    });

    setPositions(updatedPositions);
  };

  const handleClaimFee = async (address: string) => {
    if (!mtPair)
      return;

    setLoading(true);
    const res = await claimFee(jwtToken, mtPair.address, address);
    if (!res.success) {
      setLoading(false);
      toast.error("Claim Fee fail!");
      return;
    }

    setLoading(false);
    toast.success("Claim Fee success!");
  }

  const handleToggle = (address: string, view: 'add' | 'withdraw') => {
    const updatedPositions = positions?.map(one => {
      if (one.address === address) {
        return {
          ...one,
          view,
        };
      }
      return one;
    });

    setPositions(updatedPositions);
  };

  return (
    <div className="your-position">
      <div className="flex justify-between p-4">
        <p className="w-3/5">Price Range</p>
        <p className="w-1/5 text-center">24hr Fee/TVL</p>
        <p className="w-1/5 text-right">Your Liquidity</p>
      </div>
      {positions?.map((e) => (
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
              <p className="w-1/5 text-center">{toDecimalString(mtPair ? (mtPair.fees_24h / mtPair.trade_volume_24h) : 0)}%</p>
              <p className="w-1/5 text-right">${positionLiquidities.find((item) => item.address === e.address)?.liquidity.toFixed(2)}</p>
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
                  {e.feeX <= 0 && e.feeY <= 0 ? null : (
                    <Button variant="contained" color="primary" onClick={() => handleClaimFee(e.address)}>Claim Fees</Button>
                  )}
                </div>
                <div className="flex justify-between">
                  <Balances positionAddr={e.address} />
                  <UnclaimedFees positionAddr={e.address} />
                </div>
              </div>
              <ToggleButton
                view={e.view}
                onToggle={(view) => handleToggle(e.address, view)}
              />
              {e.view === 'withdraw' ? (
                <Withdraw positionAddr={e.address} />
              ) : (
                <AddPosition positionAddr={e.address} />
              )}
            </>
          )}
        </div>
      ))}
      {loading && (
        <>
          <div style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: "1000"
          }}>
            <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
              <Oval
                height="80"
                visible={true}
                width="80"
                color="#CCF869"
                ariaLabel="oval-loading"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default YourPositions;
