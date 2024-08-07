import React, { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import { Oval } from "react-loader-spinner";
import { toast } from "react-toastify";
import { BN } from '@coral-xyz/anchor';
import { MTPair, MTActiveBin, SOL_MINT, USDC_MINT } from '@/app/config';
import { getBalances, getActiveBin, swapToken } from '@/app/api/api';
import { JwtTokenContext } from '@/app/Provider/JWTTokenProvider';
import { PublicKey } from '@solana/web3.js';
import { getDecimals, getMetadataUri } from '@/app/utiles';
import { MeteoraContext } from '@/app/Provider/MeteoraProvider';

function Swap() {
  const { mtPair } = useContext(MeteoraContext);
  const [loading, setLoading] = useState(false);
  const [activeBin, setActiveBin] = useState<MTActiveBin | undefined>();
  const [xBalance, setXBalance] = useState(0);
  const [yBalance, setYBalance] = useState(0);
  const [xAmount, setXAmount] = useState(0);
  const [yAmount, setYAmount] = useState(0);
  const [swapXtoY, setSwapXtoY] = useState(true);
  const { jwtToken } = useContext(JwtTokenContext);
  const [xUrl, setXUrl] = useState('');
  const [yUrl, setYUrl] = useState('');

  const fetchActiveBin = async () => {
    if (!mtPair) {
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

    fetchData(); // Call the async function
  }, [mtPair])

  const handleSwap = async () => {
    if (!mtPair) {
      toast.error("Pool Error!");
      return;
    }

    const xDecimals = await getDecimals(mtPair.mint_x);
    const yDecimals = await getDecimals(mtPair.mint_y);

    if ( !xDecimals.success || !yDecimals.success ) {
      toast.error("Get Decimals Error!");
      return;
    }

    const xAmountLamport = xAmount * (10 ** xDecimals.decimals);
    const yAmountLamport = yAmount * (10 ** yDecimals.decimals);
    const swapAmunt = swapXtoY ? xAmountLamport : yAmountLamport;

    setLoading(true);

    const res = await swapToken(jwtToken, mtPair.address, swapAmunt, swapXtoY);
    if ( !res.success ) {
      toast.error("Swap error!");
      setLoading(false);
      return;
    }
    
    await fetchBalance();

    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto pt-6">
      {swapXtoY ? (
        <>
          <div className="swap-input">
            <div className="position-deposit flex pb-2">
              <div className="flex" style={{ alignItems: 'center' }}>
                <Image src={xUrl} alt="X Logo" width={40} height={40} />
                <p className="font-m pl-2 pr-4">{mtPair ? mtPair.name.split('-')[0] : ''}</p>
              </div>
              <input
                type="number"
                id="mintx"
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
                <Image src={yUrl} alt="Y Logo" width={40} height={40} />
                <p className="font-m pl-2 pr-4">{mtPair ? mtPair.name.split('-')[1] : ''}</p>
              </div>
              <input
                type="number"
                id="minty"
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
                <Image src={yUrl} alt="Y Logo" width={40} height={40} />
                <p className="font-m pl-2 pr-4">{mtPair ? mtPair.name.split('-')[1] : ''}</p>
              </div>
              <input
                type="number"
                id="minty"
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
                <Image src={xUrl} alt="X Logo" width={40} height={40} />
                <p className="font-m pl-2 pr-4">{mtPair ? mtPair.name.split('-')[0] : ''}</p>
              </div>
              <input
                type="number"
                id="mintx"
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