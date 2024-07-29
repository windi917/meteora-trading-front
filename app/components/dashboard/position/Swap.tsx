import React, { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import { Oval } from "react-loader-spinner";
import { toast } from "react-toastify";
import { BN } from '@coral-xyz/anchor';
import { MTPair, MTActiveBin } from '@/app/config';
import { getBalances, getActiveBin, swapToken } from '@/app/api/api';
import { JwtTokenContext } from '@/app/Provider/JWTTokenProvider';

interface SwapProps {
  mtPair: MTPair | undefined;
  refresh: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

function Swap({ mtPair, refresh, setRefresh }: SwapProps) {
  const [loading, setLoading] = useState(false);
  const [activeBin, setActiveBin] = useState<MTActiveBin | undefined>();
  const [xBalance, setXBalance] = useState(0);
  const [yBalance, setYBalance] = useState(0);
  const [xAmount, setXAmount] = useState(0);
  const [yAmount, setYAmount] = useState(0);
  const [swapXtoY, setSwapXtoY] = useState(true);
  const { jwtToken, userId, userRole } = useContext(JwtTokenContext);

  console.log("##########", userId, userRole);

  const fetchActiveBin = async () => {
    if ( !mtPair ) {
      toast.error("Pool Error!");
      return;
    }

    const res = await getActiveBin(mtPair.address);
    if (res.success === false) {
      toast.error("Get Active Bin failed!");
      return;
    }

    const bin: MTActiveBin = {
      'binId': res.response.activeBin.binId,
      'price': res.response.activeBin.price,
      'pricePerToken': res.response.activeBin.pricePerToken,
      'supply': new BN(res.response.activeBin.supply, 16),
      'xAmount': new BN(res.response.activeBin.xAmount, 16),
      'yAmount': new BN(res.response.activeBin.yAmount, 16)
    }

    setActiveBin(bin);
  }

  const fetchBalance = async () => {
    if (mtPair === undefined)
      return;

    const resX = await getBalances(mtPair.mint_x);
    if (resX.success === false) {
      toast.error("Get Balances fail!");
      return;
    }

    setXBalance(resX.response.balance);

    const resY = await getBalances(mtPair.mint_y);
    if (resY.success === false) {
      toast.error("Get Balances fail!");
      return;
    }

    setYBalance(resY.response.balance);
  }

  useEffect(() => {
    const fetchData = async () => {
      await fetchActiveBin();
      await fetchBalance();
    };

    fetchData(); // Call the async function
  }, [refresh, setRefresh])

  const handleSwap = async() => {
    if ( !mtPair ) {
      toast.error("Pool Error!");
      return;
    }

    const xAmountLamport = mtPair.mint_x === "So11111111111111111111111111111111111111112" ? xAmount * (10 ** 9) : xAmount * (10 ** 6);
    const yAmountLamport = mtPair.mint_y === "So11111111111111111111111111111111111111112" ? yAmount * (10 ** 9) : yAmount * (10 ** 6);

    const swapAmunt = swapXtoY ? xAmountLamport : yAmountLamport;
    setLoading(true);
    await swapToken(jwtToken, mtPair.address, swapAmunt, swapXtoY);
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto pt-6">
      {swapXtoY ? (
        <>
          <div className="swap-input">
            <div className="position-deposit flex pb-2">
              <div className="flex" style={{ alignItems: 'center' }}>
                <Image src="https://exponential.imgix.net/icons/assets/SOL_color.jpg?auto=format&fit=max&w=256" alt="SOL Logo" width={40} height={40} />
                <p className="font-m pl-2 pr-4">SOL</p>
              </div>
              <input
                type="number"
                id="sol"
                value={xAmount}
                onChange={(e) => { setXAmount(parseFloat(e.target.value)); setYAmount(parseFloat(e.target.value) * (activeBin ? activeBin.pricePerToken : 0)) }}
              />
            </div>
            <div className="flex justify-between">
              <p>Balance: {xBalance}</p>
              <div className="quickButtons">
                <button className="font-s">MAX</button>
                <button className="font-s">HALF</button>
              </div>
            </div>
          </div>
          <div className='mt-10 flex' style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Image src="/swap-up.png" alt="Swap Logo" width={40} height={40} onClick={() => { setSwapXtoY(!swapXtoY) }} />
          </div>
          <div className="swap-input mt-10">
            <div className="position-deposit flex pb-2">
              <div className="flex" style={{ alignItems: 'center' }}>
                <Image src="https://exponential.imgix.net/icons/assets/USDC_color.jpg?auto=format&fit=max&w=256" alt="SOL Logo" width={40} height={40} />
                <p className="font-m pl-2 pr-4">USDC</p>
              </div>
              <input
                type="number"
                id="usdc"
                value={yAmount}
                disabled
                onChange={(e) => setYAmount(parseFloat(e.target.value))}
              />
            </div>
            <div className="flex justify-between">
              <p>Balance: {yBalance}</p>
              <div className="quickButtons">
                <button className="font-s">MAX</button>
                <button className="font-s">HALF</button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="swap-input">
            <div className="position-deposit flex pb-2">
              <div className="flex" style={{ alignItems: 'center' }}>
                <Image src="https://exponential.imgix.net/icons/assets/USDC_color.jpg?auto=format&fit=max&w=256" alt="SOL Logo" width={40} height={40} />
                <p className="font-m pl-2 pr-4">USDC</p>
              </div>
              <input
                type="number"
                id="usdc"
                value={yAmount}
                onChange={(e) => { setYAmount(parseFloat(e.target.value)); setXAmount(parseFloat(e.target.value) / (activeBin ? activeBin.pricePerToken : 0)) }}
              />
            </div>
            <div className="flex justify-between">
              <p>Balance: {yBalance}</p>
              <div className="quickButtons">
                <button className="font-s">MAX</button>
                <button className="font-s">HALF</button>
              </div>
            </div>
          </div>
          <div className='mt-10 flex' style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Image src="/swap-up.png" alt="Swap Logo" width={40} height={40} onClick={() => { setSwapXtoY(!swapXtoY) }} />
          </div>
          <div className="swap-input mt-10">
            <div className="position-deposit flex pb-2">
              <div className="flex" style={{ alignItems: 'center' }}>
                <Image src="https://exponential.imgix.net/icons/assets/SOL_color.jpg?auto=format&fit=max&w=256" alt="SOL Logo" width={40} height={40} />
                <p className="font-m pl-2 pr-4">SOL</p>
              </div>
              <input
                type="number"
                id="sol"
                value={xAmount}
                disabled
                onChange={(e) => setXAmount(parseFloat(e.target.value))}
              />
            </div>
            <div className="flex justify-between">
              <p>Balance: {xBalance}</p>
              <div className="quickButtons">
                <button className="font-s">MAX</button>
                <button className="font-s">HALF</button>
              </div>
            </div>
          </div>
        </>
      )}
      <button className="w-full bg-black text-white py-2 rounded mt-10 mb-4" onClick={handleSwap}>
        Swap
      </button>
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

export default Swap;