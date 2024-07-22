import React, { useState } from 'react';
import Image from 'next/image';

import LiquidityComponent from '../LiquidityComponent';

interface AddPositionProps {
  solBalance: number;
  usdcBalance: number;
}

function AddPosition({ solBalance, usdcBalance }: AddPositionProps) {
  const [solAmount, setSolAmount] = useState(0);
  const [usdcAmount, setUsdcAmount] = useState(0);

  return (
    <div className="add-position max-w-3xl mx-auto ">
      <p>Enter deposit amount</p>
      <div className="position-border flex justify-between pt-6">
        <div className="position-input">
          <div className="position-deposit flex pb-2">
            <div className="flex" style={{ alignItems: 'center' }}>
              <Image src="https://exponential.imgix.net/icons/assets/SOL_color.jpg?auto=format&fit=max&w=256" alt="SOL Logo" width={40} height={40} />
              <p className="font-m pl-2 pr-4">SOL</p>
            </div>
            <input
              type="number"
              id="sol"
              value={solAmount}
              onChange={(e) => setSolAmount(parseFloat(e.target.value))}
            />
          </div>
          <div className="flex justify-between">
            <p>Balance: {solBalance}</p>
            <div className="quickButtons">
              <button className="font-s">MAX</button>
              <button className="font-s">HALF</button>
            </div>
          </div>
        </div>
        <div className="position-input">
          <div className="position-deposit flex pb-2">
            <div className="flex" style={{ alignItems: 'center' }}>
              <Image src="https://exponential.imgix.net/icons/assets/USDC_color.jpg?auto=format&fit=max&w=256" alt="SOL Logo" width={40} height={40} />
              <p className="font-m pl-2 pr-4">USDC</p>
            </div>
            <input
              type="number"
              id="usdc"
              value={usdcAmount}
              onChange={(e) => setUsdcAmount(parseFloat(e.target.value))}
            />
          </div>
          <div className="flex justify-between">
            <p>Balance: {usdcBalance}</p>
            <div className="quickButtons">
              <button className="font-s">MAX</button>
              <button className="font-s">HALF</button>
            </div>
          </div>
        </div>
      </div>
      <LiquidityComponent />
    </div>
  );
};

export default AddPosition;