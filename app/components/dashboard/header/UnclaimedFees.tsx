import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { PublicKey } from '@solana/web3.js';
import { MTPair } from '@/app/config';
import { SOL_MINT, USDC_MINT } from '@/app/config';
import { getMetadataUri } from '@/app/utiles';

interface UnclaimedFeesProps {
  mtPair: MTPair | undefined;
  xFee: number;
  yFee: number;
}

function UnclaimedFees({ mtPair, xFee, yFee }: UnclaimedFeesProps) {
  const [xUrl, setXUrl] = useState('');
  const [yUrl, setYUrl] = useState('');

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

  return (
    <div className="unclaimed-fees">
      <p className="pb-6">Your Unclaimed Swap Fee</p>
      <div className="flex pb-2" style={{ alignItems: 'center' }}>
        <Image src={xUrl} alt="X Logo" width={40} height={40} />
        <h2 className="pl-2">{xFee} {mtPair ? mtPair.name.split('-')[0] : ''}</h2>
      </div>
      <div className="flex" style={{ alignItems: 'center' }}>
        <Image src={yUrl} alt="Y Logo" width={40} height={40} />
        <h2 className="pl-2">{yFee} {mtPair ? mtPair.name.split('-')[1] : ''}</h2>
      </div>
    </div>
  )

};

export default UnclaimedFees;