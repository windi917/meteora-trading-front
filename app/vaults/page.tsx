'use client';

import VaultCard from "../components/vaultcard";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-between">
      <div className="container">
        <h1 className="title">Decentralized Autonomous Yield</h1>
        <p className="subtitle">Let AI do the work.</p>
        <div className="vaults">
          <VaultCard title="SOL High Yield" token="solana" aum={334000} annReturn={27.5}  button={true} width={30}/>
          <VaultCard title="USDC High Yield" token="usd-coin" aum={1534000} annReturn={27.5}  button={true} width={30}/>
          <VaultCard title="Defi Ultra Yield" token="defi" aum={194000} annReturn={270.5}  button={true} width={30}/>
        </div>
      </div>
    </div>
  );
}