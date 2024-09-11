'use client';

import { useContext } from "react";
import VaultCard from "../components/vaultcard";
import { MeteoraContext } from "../Provider/MeteoraProvider";

export default function Home() {
  const { solPosition, usdcPosition } = useContext(MeteoraContext);

  return (
    <div className="flex flex-col items-center justify-between">
      <div className="container">
        <h1 className="title">Decentralized Autonomous Yield</h1>
        <p className="subtitle">Let AI do the work.</p>
        <div className="vaults">
          <VaultCard title="SOL High Yield" token="solana" aum={solPosition?.positionUserSol} annReturn={solPosition?.positionUserSol ? (solPosition?.totalAmount ? (solPosition.positionUserSol * 100 / solPosition.totalAmount - 100) : 0) : 0}  button={true} width={0}/>
          <VaultCard title="USDC High Yield" token="usd-coin" aum={usdcPosition?.positionUserUSDC} annReturn={usdcPosition?.positionUserUSDC ? (usdcPosition?.totalAmount ? (usdcPosition.positionUserUSDC * 100 / usdcPosition.totalAmount - 100) : 0) : 0}  button={true} width={0}/>
          {/* <VaultCard title="Defi Ultra Yield" token="defi" aum={194000} annReturn={270.5}  button={true} width={30}/> */}
        </div>
      </div>
    </div>
  );
}