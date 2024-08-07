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

export default function PoolDetail({ params }: { params: { pool: string } }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [refresh, setRefresh] = useState<boolean>(false);
  const { userRole } = useContext(JwtTokenContext);
  const { setPool } = useContext(MeteoraContext);
  const router = useRouter();

  useEffect(() => {
    if (userRole === "ADMIN") {
      setPool(params.pool);
    }
    else
      router.push("/");
  }, [refresh, setRefresh])

  return (
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
          <LiquidityInfo />
          <div className="flex justify-between">
            <Balances positionAddr='TOTAL'/>
            <UnclaimedFees positionAddr='TOTAL'/>
          </div>
          <Position />
        </>
      )}
    </div>
  );
};