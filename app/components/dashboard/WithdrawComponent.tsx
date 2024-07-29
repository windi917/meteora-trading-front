import React, { useState, useContext } from 'react';
import { Oval } from "react-loader-spinner";
import { toast } from "react-toastify";
import { MTActiveBin, MTPair, MTPosition } from '@/app/config';
import { removeLiquidity, closePosition } from '@/app/api/api';
import { JwtTokenContext } from '@/app/Provider/JWTTokenProvider';

interface WithdrawProps {
  position: MTPosition | undefined;
  mtPair: MTPair | undefined;
  activeBin: MTActiveBin | undefined;
  refresh: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

const Withdraw = ({ position, mtPair, activeBin, refresh, setRefresh }: WithdrawProps) => {
  const [loading, setLoading] = useState(false);
  const [bps, setBps] = useState(100);
  const [xReceive, setXReceive] = useState(position ? position.totalXAmount : 0);
  const [yReceive, setYReceive] = useState(position ? position.totalYAmount : 0);
  const { jwtToken } = useContext(JwtTokenContext);

  const handleWithdraw = async () => {
    console.log("@@@@@@@@@@@@", position)
    if (!mtPair || !position) {
      toast.error("Pool or Position invalid!");
      return;
    }

    setLoading(true);

    let res;
    if ( position.totalXAmount === 0 && position.totalYAmount === 0 )
      res = await closePosition(jwtToken, mtPair.address, position.address);
    else res = await removeLiquidity(jwtToken, mtPair.address, position.address, bps, false);

    if (res.success === false)
      toast.error("Remove Liquidity Fail!");
    else {
      toast.success("Remove Liquidity Success!");
      setRefresh(!refresh);
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
    console.log("####", position.totalXAmount, position.totalYAmount)
    if ( position.totalXAmount === 0 && position.totalYAmount === 0 )
      res = await closePosition(jwtToken, mtPair.address, position.address);
    else res = await removeLiquidity(jwtToken, mtPair.address, position.address, 100, true);
    if (res.success === false)
      toast.error("Remove Liquidity Fail!");
    else {
      toast.success("Remove Liquidity Success!");
      setRefresh(!refresh);
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
              <img src="https://exponential.imgix.net/icons/assets/SOL_color.jpg?auto=format&fit=max&w=256" alt="SOL" className="w-5 h-5 mr-2" />
              {Number(Number(xReceive).toFixed(6))} SOL
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="flex items-center">
              <img src="https://exponential.imgix.net/icons/assets/USDC_color.jpg?auto=format&fit=max&w=256" alt="USDC" className="w-5 h-5 mr-2" />
              {Number(Number(yReceive).toFixed(6))} USDC
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
