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
  const { jwtToken } = useContext(JwtTokenContext);
  const { positions, setPositions, mtPair } = useContext(MeteoraContext);
  const [loading, setLoading] = useState(false);
  const [positionLiquidities, setPositionLiquidities] = useState<Liquidity[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!mtPair) return;

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

        if (!positions) return;

        const data = positions.map((e) => ({
          address: e.address,
          liquidity: e.totalXAmount * xPriceData.price + e.totalYAmount * yPriceData.price,
        }));

        setPositionLiquidities(data);
      }
    };

    fetchData();
  }, [positions, mtPair]);

  const handleClick = (address: string) => {
    const updatedPositions = positions?.map((one) => {
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
    if (!mtPair) return;

    setLoading(true);
    const res = await claimFee(jwtToken, mtPair.address, address);
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@", res);
    if (res.success === false)
      toast.success("Claim Fee failed!");
    else {

      // let outXAmount = 0; 
      // let outYAmount = 0;

      // if ( res.swapXRes ) {
      //   outXAmount = res.swapXRes.outAmount ? parseInt(res.swapXRes.outAmount) : 0;
      // }
      // if ( res.swapYRes ) {
      //   outYAmount = res.swapYRes.outAmount ? parseInt(res.swapYRes.outAmount) : 0;
      // }

      // let outAmount = outXAmount + outYAmount;

      // if ( sol_usdc === 1 )
      //   outAmount = outAmount / (10 ** 9);
      // else if ( sol_usdc === 2 )
      //   outAmount = outAmount / (10 ** 6);

      // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@", outXAmount, outYAmount, outAmount, sol_usdc)

      // if ( outAmount > 0 )
      //   await adminPositionWithdrawApi(jwtToken, mtPair.address, bps, outAmount);

      toast.success("Claim Fee success!");
    }

    setLoading(false);
  };

  const handleToggle = (address: string, view: 'add' | 'withdraw') => {
    const updatedPositions = positions?.map((one) => {
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
    <div className="space-y-6">
      {/* Header for both Mobile and Desktop */}
      <div className="flex justify-between items-center pl-4 pr-10 mb-4">
        <p className="text-left w-1/2 text-sm font-semibold">Price Range</p>
        {/* Show Fee/TVL on Medium and Larger Screens Only */}
        <p className="hidden md:block w-1/4 text-center text-sm font-semibold">24hr Fee/TVL</p>
        <p className="text-right w-1/2 md:w-1/4 text-sm font-semibold">Liquidity</p>
      </div>

      {/* Position Cards */}
      {positions?.map((e) => (
        <div className="position-card shadow-md rounded-lg mb-6" key={e.address}>
          {/* Card Header */}
          <div className="p-4 md:p-6 cursor-pointer border-2 shadow-md rounded-lg border-gray-200" onClick={() => handleClick(e.address)}>
            <div className="flex items-center justify-between">
              {/* Price Range */}
              <div className="w-1/2 flex flex-row items-center justify-start">
                <p className="text-left text-sm md:text-base font-medium">
                  {e.positionBinData && e.positionBinData.length > 0 ? (
                    <>
                      <span>{Number(e.positionBinData[0].pricePerToken).toFixed(2)}</span>
                      <span> - </span>
                      <span>{Number(e.positionBinData[e.positionBinData.length - 1].pricePerToken).toFixed(2)}</span>
                    </>
                  ) : (
                    "0 - 0"
                  )}
                </p>
              </div>
              {/* 24hr Fee/TVL - Visible on Desktop */}
              <div className="hidden md:block w-1/4 text-center">
                <p className="text-sm md:text-base">{toDecimalString(mtPair ? (mtPair.fees_24h / mtPair.trade_volume_24h) : 0)}%</p>
              </div>
              {/* Liquidity */}
              <div className="w-1/2 md:w-1/4 text-right">
                <p className="text-sm md:text-base">${positionLiquidities.find((item) => item.address === e.address)?.liquidity.toFixed(2)}</p>
              </div>
              {e.visible ? (
                  <img src="/collapse.png" className="w-5 h-5 ml-2 md:ml-6" alt="Collapse" />
                ) : (
                  <img src="/drop.png" className="w-5 h-5 ml-2 md:ml-6" alt="Drop" />
                )}
            </div>
          </div>

          {/* Card Content */}
          {e.visible && (
            <>
              <div className="p-4 md:p-6">
                <div className="flex justify-between mb-4 items-center">
                  <p className="font-semibold text-sm md:text-base">Position Liquidity</p>
                  {e.feeX > 0 || e.feeY > 0 ? (
                    <Button variant="contained" color="primary" onClick={() => handleClaimFee(e.address)}>Claim Fees</Button>
                  ) : null}
                </div>
                <div className="flex flex-col md:flex-row justify-around border-b-2 border-gray-100">
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

      {/* Loading Spinner */}
      {loading && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
          <Oval height="80" visible={true} width="80" color="#CCF869" ariaLabel="oval-loading" />
        </div>
      )}
    </div>
  );
}

export default YourPositions;
