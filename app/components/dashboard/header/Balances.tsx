import React, { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import { PublicKey } from '@solana/web3.js';
import { SOL_MINT, USDC_MINT } from '@/app/config';
import { getMetadataUri, toDecimalString } from '@/app/utiles';
import { MeteoraContext } from '@/app/Provider/MeteoraProvider';

interface AddPositionProps {
  positionAddr: string;
}

function Balances({ positionAddr }: AddPositionProps) {
  const [xUrl, setXUrl] = useState('');
  const [yUrl, setYUrl] = useState('');
  const { mtPair, positions } = useContext(MeteoraContext);

  const position = positions?.find(e => e.address === positionAddr);
  let xBalance, yBalance;

  if (positionAddr === 'TOTAL') {
    xBalance = positions ? (positions.length ? positions.map(e => e.totalXAmount).reduce((acc, value) => Number(acc) + Number(value)) : 0) : 0;
    yBalance = positions ? (positions.length ? positions.map(e => e.totalYAmount).reduce((acc, value) => Number(acc) + Number(value)) : 0) : 0;
  } else {
    xBalance = position ? position.totalXAmount : 0;
    yBalance = position ? position.totalYAmount : 0;
  }

  useEffect(() => {
    const fetchMetadataUris = async () => {
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

    fetchMetadataUris();
  }, [mtPair, positions]);

  return (
    <div className="p-4 lg:p-6">
      <p className="text-lg font-semibold pb-4">Current Balance</p>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Image src={xUrl} alt="X Logo" width={40} height={40} className="rounded-full" />
          <h2 className="text-lg font-medium">{toDecimalString(xBalance)} {mtPair ? mtPair.name.split('-')[0] : ''}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Image src={yUrl} alt="Y Logo" width={40} height={40} className="rounded-full" />
          <h2 className="text-lg font-medium">{toDecimalString(yBalance)} {mtPair ? mtPair.name.split('-')[1] : ''}</h2>
        </div>
      </div>
    </div>
  );
}
export default Balances;
