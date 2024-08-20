'use client';

import React, { useState, useEffect, useCallback, useContext } from "react";
import LiquidityInfo from '../../components/dashboard/header/LiquidityInfo';
import Balances from '../../components/dashboard/header/Balances';
import UnclaimedFees from '../../components/dashboard/header/UnclaimedFees';
import Position from '../../components/dashboard/position/Position';
import { Oval } from "react-loader-spinner";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { JwtTokenContext } from "@/app/Provider/JWTTokenProvider";
import { MeteoraContext } from "@/app/Provider/MeteoraProvider";
import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import PoolInfo from "@/app/components/dashboard/position/PoolInfo";

export default function PoolDetail({ params }: { params: { pool: string } }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [refresh, setRefresh] = useState<boolean>(false);
  const { userRole } = useContext(JwtTokenContext);
  const { setPool } = useContext(MeteoraContext);
  const { connected } = useWallet() as WalletContextState & {
    signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  };
  const router = useRouter();

  useEffect(() => {
    setPool(params.pool);
  }, [userRole, refresh, setRefresh])

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
          <>
            <PoolInfo />
            <LiquidityInfo />
            <div className="flex justify-between">
              <Balances positionAddr='TOTAL' />
              <UnclaimedFees positionAddr='TOTAL' />
            </div>
            <Position />
          </>
        )}
      </div>
    ) : (
      <div className="container mx-auto p-4">
        Routing Error!
      </div>
    )
  )
};