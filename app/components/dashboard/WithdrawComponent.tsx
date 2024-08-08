import React, { useState, useContext, useEffect } from 'react';
import { Oval } from "react-loader-spinner";
import { toast } from "react-toastify";
import { MTActiveBin, MTPair, MTPosition } from '@/app/config';
import { removeLiquidity, closePosition, getPoolDepositRole, adminPositionWithdrawApi } from '@/app/api/api';
import { JwtTokenContext } from '@/app/Provider/JWTTokenProvider';
import { getMetadataUri } from '@/app/utiles';
import { SOL_MINT, USDC_MINT } from '@/app/config';
import { PublicKey } from '@solana/web3.js';
import { MeteoraContext } from '@/app/Provider/MeteoraProvider';

interface WithdrawProps {
  positionAddr: string;
}

const Withdraw = ({ positionAddr }: WithdrawProps) => {
  const { positions, mtPair } = useContext(MeteoraContext);

  const position = positions?.find(e => e.address === positionAddr);

  const [loading, setLoading] = useState(false);
  const [bps, setBps] = useState(100);
  const [xReceive, setXReceive] = useState(position ? position.totalXAmount : 0);
  const [yReceive, setYReceive] = useState(position ? position.totalYAmount : 0);
  const [xUrl, setXUrl] = useState('');
  const [yUrl, setYUrl] = useState('');
  const { jwtToken } = useContext(JwtTokenContext);

  useEffect(() => {
    const fetchMetadataUris = async () => {
      if (!mtPair)
        return;

      if (mtPair.name.split("-").length === 2) {
        let mintXUri;
        if (mtPair.mint_x === SOL_MINT)
          mintXUri = 'https://exponential.imgix.net/icons/assets/SOL_color.jpg?auto=format&fit=max&w=256';
        else if (mtPair.mint_x === USDC_MINT)
          mintXUri = 'https://exponential.imgix.net/icons/assets/USDC_color.jpg?auto=format&fit=max&w=256';
        else mintXUri = await getMetadataUri(new PublicKey(mtPair.mint_x));

        let mintYUri;
        if (mtPair.mint_y === SOL_MINT)
          mintYUri = 'https://exponential.imgix.net/icons/assets/SOL_color.jpg?auto=format&fit=max&w=256';
        else if (mtPair.mint_y === USDC_MINT)
          mintYUri = 'https://exponential.imgix.net/icons/assets/USDC_color.jpg?auto=format&fit=max&w=256';
        else mintYUri = await getMetadataUri(new PublicKey(mtPair.mint_y));

        setXUrl(mintXUri);
        setYUrl(mintYUri);
      }
    };

    fetchMetadataUris();
  }, []);

  const handleWithdraw = async () => {
    if (!mtPair || !position) {
      toast.error("Pool or Position invalid!");
      return;
    }

    setLoading(true);

    let res;
    let sol_usdc = 0;

    if (position.totalXAmount === 0 && position.totalYAmount === 0) {
      toast.error("Nothing to withdraw in this position!");
      setLoading(false);
      return;
    }
    else {
      const positionRole = await getPoolDepositRole(mtPair.address);
      if (!positionRole.success) {
        toast.error("Get Pool Role Error!");
        return;
      }

      if (positionRole)
        sol_usdc = positionRole.response.sol_usdc;

      if (sol_usdc === 1)
        res = await removeLiquidity(jwtToken, mtPair.address, position.address, bps, false, 'sol');
      else if (sol_usdc == 2)
        res = await removeLiquidity(jwtToken, mtPair.address, position.address, bps, false, 'usdc');
    }

    console.log("##############", res)
    if (res.success === false)
      toast.error("Remove Liquidity Fail!");
    else {
      const outXAmount = res.swapXRes.outAmount ? res.swapXRes.outAmount : 0;
      const outYAmount = res.swapYRes.outAmount ? res.swapYRes.outAmount : 0;
      let outAmount = parseInt(outXAmount) + parseInt(outYAmount);

      if ( sol_usdc === 1 )
        outAmount = outAmount / (10 ** 9);
      else if ( sol_usdc === 2 )
        outAmount = outAmount / (10 ** 6);

      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@", outXAmount, outYAmount, outAmount, sol_usdc)

      if ( outAmount > 0 )
        await adminPositionWithdrawApi(jwtToken, mtPair.address, bps, outAmount);

      toast.success("Remove Liquidity Success!");
    }

    setLoading(false);
  }

  const handleWithdrawClose = async () => {
    if (!mtPair || !position) {
      toast.error("Pool or Position invalid!");
      return;
    }

    setLoading(true);

    let res;
    let sol_usdc = 0;

    if (position.totalXAmount === 0 && position.totalYAmount === 0 && position.feeX === 0 && position.feeY === 0)
      res = await closePosition(jwtToken, mtPair.address, position.address);
    else {
      const positionRole = await getPoolDepositRole(mtPair.address);
      if (!positionRole.success) {
        toast.error("Get Pool Role Error!");
        return;
      }

      if (positionRole)
        sol_usdc = positionRole.response.sol_usdc;

      if (sol_usdc === 1)
        res = await removeLiquidity(jwtToken, mtPair.address, position.address, 100, true, 'sol');
      else if (sol_usdc === 2)
        res = await removeLiquidity(jwtToken, mtPair.address, position.address, 100, true, 'usdc');
    }
    
    console.log("##############", res)
    if (res.success === false)
      toast.error("Remove Liquidity Fail!");
    else {
      const outXAmount = res.swapXRes.outAmount ? res.swapXRes.outAmount : 0;
      const outYAmount = res.swapYRes.outAmount ? res.swapYRes.outAmount : 0;
      let outAmount = parseInt(outXAmount) + parseInt(outYAmount);

      if ( sol_usdc === 1 )
        outAmount = outAmount / (10 ** 9);
      else if ( sol_usdc === 2 )
        outAmount = outAmount / (10 ** 6);

      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@", outXAmount, outYAmount, outAmount, sol_usdc)

      if ( outAmount > 0 )
        await adminPositionWithdrawApi(jwtToken, mtPair.address, bps, outAmount);

      toast.success("Remove Liquidity Success!");
    }
    
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto p-4 rounded-lg shadow-md mt-8">
      <div>
        <label className="block text-white-700 font-m font-bold mb-2">
          Percentage to withdraw
        </label>
        <div className="quickButtons">
          <button className="font-s" onClick={() => { setBps(25); setXReceive(position ? position.totalXAmount / 4 : 0); setYReceive(position ? position.totalYAmount / 4 : 0); }}>25%</button>
          <button className="font-s" onClick={() => { setBps(50); setXReceive(position ? position.totalXAmount / 2 : 0); setYReceive(position ? position.totalYAmount / 2 : 0) }}>50%</button>
          <button className="font-s" onClick={() => { setBps(75); setXReceive(position ? position.totalXAmount * 3 / 4 : 0); setYReceive(position ? position.totalYAmount * 3 / 4 : 0); }}>75%</button>
          <button className="font-s" onClick={() => { setBps(100); setXReceive(position ? position.totalXAmount : 0); setYReceive(position ? position.totalYAmount : 0); }}>100%</button>
        </div>
        <div className="flex items-center border-b border-gray-300 py-2 mb-8">
          <input
            className="appearance-none bg-transparent border-none w-full text-white-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
            type="number"
            placeholder="100"
            value={bps}
            onChange={(e) => { setBps(Number(e.target.value)); setXReceive(position ? position.totalXAmount * Number(e.target.value) / 100 : 0); setYReceive(position ? position.totalYAmount * Number(e.target.value) / 100 : 0); }}
          />
          <span className="text-white-500">%</span>
        </div>
      </div>
      <div className="mb-8">
        <p className="text-white-700 font-m font-bold mb-2">You receive:</p>
        <div className="p-4 border border-gray-300 rounded-lg mb-4 gap-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center">
              <img src={xUrl} alt="mintx" className="w-5 h-5 mr-2" />
              {Number(Number(xReceive).toFixed(6))} {mtPair ? mtPair.name.split('-')[0] : ''}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="flex items-center">
              <img src={yUrl} alt="minty" className="w-5 h-5 mr-2" />
              {Number(Number(yReceive).toFixed(6))} {mtPair ? mtPair.name.split('-')[1] : ''}
            </span>
          </div>
        </div>
      </div>
      <button className="w-full bg-black text-white py-2 rounded mb-4" onClick={handleWithdraw}>
        Withdraw Liquidity
      </button>
      <button className="w-full border border-gray-300 py-2 rounded" onClick={handleWithdrawClose}>
        Withdraw & Close Position
      </button>
      <p className="text-xs text-gray-500 text-center mt-2">* Claim included</p>
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
};

export default Withdraw;
