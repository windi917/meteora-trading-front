'use client'

import React, { useState, useEffect, useCallback, useContext } from "react";
import Link from 'next/link'; // Import Link from Next.js
import { Oval } from "react-loader-spinner";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { getAllPair } from '../api/api'
import { MTPair } from '../config'
import { JwtTokenContext } from "../Provider/JWTTokenProvider";

export default function Dashboard() {
  const [loading, setLoading] = useState<boolean>(false);
  const [mtPairs, setMTPairs] = useState<MTPair[]>([]);
  const { userRole } = useContext(JwtTokenContext);
  const router = useRouter();

  const fetchPairs = async () => {
    const pairs = await getAllPair();
    if (pairs.success === false) {
      toast.error("Get LP Pairs failed!");
      return;
    }

    const sol_usdc = pairs.response.filter((e: MTPair) => e.name === 'SOL-USDC' || e.name === 'USDC-SOL')
    sol_usdc.sort((a: MTPair, b: MTPair) => b.trade_volume_24h - a.trade_volume_24h);
    console.log("SOL-USDC : ", sol_usdc)
    setMTPairs(sol_usdc);
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      await fetchPairs();

      setLoading(false);
    };

    if (userRole === "ADMIN")
      fetchData(); // Call the async function
    else
      router.push("/"); // <-- Redirect to another page if not admin
  }, [])

  return (
    <div className="container mx-auto p-4">
      <div className="shadow-md rounded-lg p-4">
        <div className="grid grid-cols-6 gap-4">
          <span className="font-m">Pool</span>
          <span className="font-m">Your Deposits</span>
          <span className="font-m">TVL</span>
          <span className="font-m">24H Vol</span>
          <span className="font-m">24hr Fee/TVL</span>
          <span className="font-m">LM APR</span>
        </div>
        {mtPairs.map((pool, index) => (
          <Link href={`/dashboard/${pool.address}`} key={index}>
            <div
              key={index}
              className="grid grid-cols-6 gap-4 items-center bg-gray-100 p-4 pt-8 pb-8 mt-2 rounded-lg font-s text-black "
            >
              <div className="flex items-center">
                {pool.name === 'SOL-USDC' ? (
                  <>
                    <img src="https://exponential.imgix.net/icons/assets/SOL_color.jpg?auto=format&fit=max&w=256" alt="SOL" className="w-8 h-8 mr-2" />
                    <img src="https://exponential.imgix.net/icons/assets/USDC_color.jpg?auto=format&fit=max&w=256" alt="USDC" className="w-8 h-8 mr-2" />
                  </>
                ) : (
                  <>
                    <img src="https://exponential.imgix.net/icons/assets/USDC_color.jpg?auto=format&fit=max&w=256" alt="USDC" className="w-8 h-8 mr-2" />
                    <img src="https://exponential.imgix.net/icons/assets/SOL_color.jpg?auto=format&fit=max&w=256" alt="SOL" className="w-8 h-8 mr-2" />
                  </>
                )}
                <span>{pool.name}</span>
              </div>
              <span>-</span> {/* Placeholder for Your Deposits */}
              <span>${Number(pool.liquidity).toFixed(2)}</span>
              {pool.trade_volume_24h === 0.0 ? (
                <span>-</span>
              ) : (
                <span>${Number(pool.trade_volume_24h).toFixed(2)}</span>
              )}
              {pool.trade_volume_24h === 0.0 || pool.liquidity === 0.0 ? (
                <span>-</span>
              ) : (
                <span>{Number(pool.trade_volume_24h / pool.liquidity).toFixed(2)}%</span>
              )}
              <span>-</span>
            </div>
          </Link>
        ))}
      </div>
      {loading && (
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
      )}
    </div>
  );
};