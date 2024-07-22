import Image from 'next/image';

interface UnclaimedFeesProps {
  solFee: number;
  usdcFee: number;
}

function UnclaimedFees({ solFee, usdcFee } : UnclaimedFeesProps) {

  return (
    <div className="unclaimed-fees">
      <p className="pb-6">Your Unclaimed Swap Fee</p>
      <div className="flex pb-2" style={{ alignItems: 'center' }}>
        <Image src="https://exponential.imgix.net/icons/assets/SOL_color.jpg?auto=format&fit=max&w=256" alt="SOL Logo" width={40} height={40} />
        <h2 className="pl-2">{solFee} SOL</h2>
      </div>
      <div className="flex" style={{ alignItems: 'center' }}>
        <Image src="https://exponential.imgix.net/icons/assets/USDC_color.jpg?auto=format&fit=max&w=256" alt="USDC Logo" width={40} height={40} />
        <h2 className="pl-2">{usdcFee} USDC</h2>
      </div>
    </div>
  )

};

export default UnclaimedFees;