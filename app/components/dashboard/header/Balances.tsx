import Image from 'next/image';

interface BalancesProps {
  solBalance: number;
  usdcBalance: number;
}

function Balances({ solBalance, usdcBalance }: BalancesProps) {
  return (
    <div className="balances">
      <p className="pb-6">Current Balance</p>
      <div className="flex pb-2" style={{ alignItems: 'center' }}>
        <Image src="https://exponential.imgix.net/icons/assets/SOL_color.jpg?auto=format&fit=max&w=256" alt="SOL Logo" width={40} height={40} />
        <h2 className="pl-2">{solBalance} SOL</h2>
      </div>
      <div className="flex" style={{ alignItems: 'center' }}>
        <Image src="https://exponential.imgix.net/icons/assets/USDC_color.jpg?auto=format&fit=max&w=256" alt="USDC Logo" width={40} height={40} />
        <h2 className="pl-2">{usdcBalance} USDC</h2>
      </div>
    </div>
  );
}
export default Balances;