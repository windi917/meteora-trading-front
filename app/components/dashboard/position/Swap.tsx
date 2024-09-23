import React, { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import { Oval } from "react-loader-spinner";
import { debouncedToast } from '@/app/utiles';
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
      debouncedToast("Pool Error!", "error");
      return;
    }

    const res = await getActiveBin(mtPair.address);
    if (res.success === false) {
      debouncedToast("Get Active Bin failed!", "error");
      return;
    }

    const bin: MTActiveBin = {
      'binId': res.response.activeBin.binId,
      'price': res.response.activeBin.price,
      'pricePerToken': res.response.activeBin.pricePerToken,
      'supply': new BN(res.response.activeBin.supply, 16),
      'xAmount': new BN(res.response.activeBin.xAmount, 16),
      'yAmount': new BN(res.response.activeBin.yAmount, 16)
    };

    setActiveBin(bin);
  };

  const fetchBalance = async () => {
    if (mtPair === undefined) return;

    const resX = await getBalances(mtPair.mint_x);
    if (!resX.success) {
      debouncedToast("Get Balances fail!", "error");
      return;
    }

    setXBalance(resX.response.balance);

    const resY = await getBalances(mtPair.mint_y);
    if (!resY.success) {
      debouncedToast("Get Balances fail!", "error");
      return;
    }

    setYBalance(resY.response.balance);
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchActiveBin();
      await fetchBalance();

      if (!mtPair) return;

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
  }, [mtPair]);

  const handleSwap = async () => {
    if (!mtPair) {
      debouncedToast("Pool Error!", "error");
      return;
    }

    const xDecimals = await getDecimals(mtPair.mint_x);
    const yDecimals = await getDecimals(mtPair.mint_y);

    if (!xDecimals.success || !yDecimals.success) {
      debouncedToast("Get Decimals Error!", "error");
      return;
    }

    const xAmountLamport = xAmount * (10 ** xDecimals.decimals);
    const yAmountLamport = yAmount * (10 ** yDecimals.decimals);
    const swapAmount = swapXtoY ? xAmountLamport : yAmountLamport;

    setLoading(true);

    const res = await swapToken(jwtToken, mtPair.address, swapAmount, swapXtoY);
    if (!res.success) {
      debouncedToast("Swap error!", "error");
      setLoading(false);
      return;
    }

    await fetchBalance();
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="swap-section space-y-6">
        {/* Swap Input Section */}
        <div className="swap-input space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Image src={swapXtoY ? xUrl : yUrl} alt="Token Logo" width={36} height={36} />
              <p className="font-medium text-sm">{mtPair ? mtPair.name.split('-')[swapXtoY ? 0 : 1] : ''}</p>
            </div>
            <input
              type="number"
              value={swapXtoY ? xAmount : yAmount}
              onChange={(e) => swapXtoY ? setXAmount(parseFloat(e.target.value)) : setYAmount(parseFloat(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 w-1/2 text-sm"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <p>Balance: {swapXtoY ? xBalance : yBalance}</p>
            <div className="quickButtons space-x-2">
              <button className="font-medium" onClick={() => swapXtoY ? setXAmount(xBalance) : setYAmount(yBalance)}>MAX</button>
              <button className="font-medium" onClick={() => swapXtoY ? setXAmount(xBalance / 2) : setYAmount(yBalance / 2)}>HALF</button>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center items-center">
          <Image src="/swap-up.png" alt="Swap Logo" width={32} height={32} onClick={() => { setSwapXtoY(!swapXtoY) }} className="cursor-pointer" />
        </div>

        {/* Swap Output Section */}
        <div className="swap-input space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Image src={swapXtoY ? yUrl : xUrl} alt="Token Logo" width={36} height={36} />
              <p className="font-medium text-sm">{mtPair ? mtPair.name.split('-')[swapXtoY ? 1 : 0] : ''}</p>
            </div>
            <input
              type="number"
              value={swapXtoY ? yAmount : xAmount}
              disabled
              className="border border-gray-300 rounded px-2 py-1 w-1/2 text-sm bg-gray-100"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <p>Balance: {swapXtoY ? yBalance : xBalance}</p>
            <div className="quickButtons space-x-2">
              <button className="font-medium" disabled>MAX</button>
              <button className="font-medium" disabled>HALF</button>
            </div>
          </div>
        </div>

        {/* Confirm Swap Button */}
        <button className="w-full bg-blue-600 text-white py-2 rounded text-sm" onClick={handleSwap}>
          Swap
        </button>

        {/* Loading Indicator */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <Oval height="80" visible={true} width="80" color="#CCF869" ariaLabel="oval-loading" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Swap;
