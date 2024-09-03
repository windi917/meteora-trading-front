import { SOL_MINT, USDC_MINT } from '@/app/config';
import { MeteoraContext } from '@/app/Provider/MeteoraProvider';
import { getDecimals, getMetadataUri } from '@/app/utiles';
import { PublicKey } from '@solana/web3.js';
import React, { useState, useEffect, useContext } from 'react';

function PoolInfo() {
  const [xUrl, setXUrl] = useState('');
  const [yUrl, setYUrl] = useState('');
  const [xDecimal, setXDecimal] = useState(0);
  const [yDecimal, setYDecimal] = useState(0);
  const { mtPair } = useContext(MeteoraContext);

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

      const xDecimals = await getDecimals(mtPair.mint_x);
      const yDecimals = await getDecimals(mtPair.mint_y);

      if (!xDecimals.success || !yDecimals.success) {
        return;
      }

      setXDecimal(xDecimals.decimals);
      setYDecimal(yDecimals.decimals);
    };

    fetchMetadataUris();
  }, [mtPair]);

  return (
    <div className="md:m-2 md:p-2 flex flex-col gap-8">
      {/* Pool TVL and Liquidity Allocation */}
      <div className="flex-1 mb-6">
        <h2 className="text-xl font-bold mb-2">Pool TVL</h2>
        <h1 className="text-3xl font-semibold mb-6">${Number(mtPair?.liquidity).toFixed(2)}</h1>
        <div className="border-t border-gray-300 pt-4">
          <h3 className="text-lg font-semibold mb-4">Liquidity Allocation</h3>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <img src={xUrl} alt={mtPair ? mtPair.name.split('-')[0] : ''} className="w-6 h-6 mr-2" />
              <span>{mtPair ? mtPair.name.split('-')[0] : ''}</span>
            </div>
            <span className='text-lg font-medium'>
              {mtPair && mtPair.reserve_x_amount !== undefined && mtPair.reserve_x_amount !== null
                ? Number(mtPair.reserve_x_amount / (10 ** xDecimal)).toFixed(2)
                : 0}
            </span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <img src={yUrl} alt={mtPair ? mtPair.name.split('-')[1] : ''} className="w-6 h-6 mr-2" />
              <span>{mtPair ? mtPair.name.split('-')[1] : ''}</span>
            </div>
            <span className='text-lg font-medium'>
              {mtPair && mtPair.reserve_y_amount !== undefined && mtPair.reserve_y_amount !== null
                ? Number(mtPair.reserve_y_amount / (10 ** yDecimal)).toFixed(2)
                : 0}
            </span>
          </div>
        </div>
      </div>

      {/* Fee Information */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex justify-between">
          <span className="text-sm md:text-base font-medium">Bin Step</span>
          <span className='text-lg font-semibold'>{Number(mtPair?.bin_step).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm md:text-base font-medium">Base Fee</span>
          <span className='text-lg font-semibold'>{Number(mtPair?.base_fee_percentage).toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm md:text-base font-medium">Max Fee</span>
          <span className='text-lg font-semibold'>{Number(mtPair?.max_fee_percentage).toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm md:text-base font-medium">Protocol Fee</span>
          <span className='text-lg font-semibold'>{Number(mtPair?.protocol_fee_percentage).toFixed(2)}%</span>
        </div>
        <div className="flex justify-between font-bold mt-4">
          <span className="text-sm md:text-base font-medium">24h Fee</span>
          <span className='text-lg font-semibold'>${Number(mtPair?.fees_24h).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default PoolInfo;
