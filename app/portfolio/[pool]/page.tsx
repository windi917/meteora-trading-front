'use client';

import React, { useState, useEffect, useContext } from "react";
import LiquidityInfo from '../../components/dashboard/header/LiquidityInfo';
import Balances from '../../components/dashboard/header/Balances';
import UnclaimedFees from '../../components/dashboard/header/UnclaimedFees';
import Position from '../../components/dashboard/position/Position';
import { Oval } from "react-loader-spinner";
import { JwtTokenContext } from "@/app/Provider/JWTTokenProvider";
import { MeteoraContext } from "@/app/Provider/MeteoraProvider";
import PoolInfo from "@/app/components/dashboard/position/PoolInfo";
import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";

export default function PoolDetail({ params }: { params: { pool: string } }) {
  const [loading, setLoading] = useState<boolean>(false);
  const { userRole } = useContext(JwtTokenContext);
  const { setPool } = useContext(MeteoraContext);
  const { connected } = useWallet() as WalletContextState & {
    signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  };

  useEffect(() => {
    setPool(params.pool);
  }, [userRole]);

  return !connected ? (
    <div className="container mx-auto p-4">
      Wallet disconnected!
    </div>
  ) : (
    userRole === "ADMIN" ? (
      <div className="App">
        {loading ? (
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
        ) : (
          <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side - Pool Info */}
            <div className="lg:col-span-1">
              <PoolInfo />
            </div>

            {/* Right side - Liquidity Info and Positions */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <LiquidityInfo />
              <div className="flex justify-between items-start gap-4">
                <Balances positionAddr='TOTAL' />
                <UnclaimedFees positionAddr='TOTAL' />
              </div>
              <Position />
            </div>
          </div>
        )}
      </div >
    ) : (
      <div className="container mx-auto p-4">
        Routing Error!
      </div>
    )
  )
};
