'use client';

import React, { useState, useEffect, useCallback, useContext } from "react";
import LiquidityInfo from '../../components/dashboard/header/LiquidityInfo';
import Balances from '../../components/dashboard/header/Balances';
import UnclaimedFees from '../../components/dashboard/header/UnclaimedFees';
import Position from '../../components/dashboard/position/Position';
import { Oval } from "react-loader-spinner";
import { toast } from "react-toastify";
import { getPair, getPositions, getActiveBin } from '../../api/api'
import { MTPair, MTPosition, MTActiveBin } from '../../config'
import { BN } from "@coral-xyz/anchor";
import { useRouter } from "next/navigation";
import { JwtTokenContext } from "@/app/Provider/JWTTokenProvider";

export default function PoolDetail({ params }: { params: { pool: string } }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [mtPair, setMTPair] = useState<MTPair>();
  const [activeBin, setActiveBin] = useState<MTActiveBin>();
  const [positions, setPositions] = useState<MTPosition[]>();
  const [refresh, setRefresh] = useState<boolean>(false);
  const { userRole } = useContext(JwtTokenContext);
  const router = useRouter();

  const fetchPair_Positions = async () => {
    const pair = await getPair(params.pool);
    if (pair.success === false) {
      toast.error("Get LP Pairs failed!");
      return;
    }

    setMTPair(pair.response);

    const posRes = await getPositions(params.pool);
    if (posRes.success === false) {
      toast.error("Get Positions failed!");
      return;
    }

    const decimalX = pair.response.mint_x === "So11111111111111111111111111111111111111112" ? 9 : 6;
    const decimalY = pair.response.mint_y === "So11111111111111111111111111111111111111112" ? 9 : 6;

    const pos: MTPosition[] = posRes.response.userPositions.map((e: any) => ({
      'address': e.publicKey,
      'feeX': new BN(e.positionData.feeX, 16).toNumber() / (10 ** decimalX),
      'feeY': new BN(e.positionData.feeY, 16).toNumber() / (10 ** decimalY),
      'lowerBinId': e.positionData.lowerBinId,
      'positionBinData': e.positionData.positionBinData,
      'rewardOne': new BN(e.positionData.rewardOne, 16).toNumber() / (10 ** decimalX),
      'rewardTwo': new BN(e.positionData.rewardTwo, 16).toNumber() / (10 ** decimalY),
      'totalClaimedFeeXAmount': new BN(e.positionData.totalClaimedFeeXAmount, 16).toNumber() / (10 ** decimalX),
      'totalClaimedFeeYAmount': new BN(e.positionData.totalClaimedFeeYAmount, 16).toNumber() / (10 ** decimalY),
      'totalXAmount': e.positionData.totalXAmount / (10 ** decimalX),
      'totalYAmount': e.positionData.totalYAmount / (10 ** decimalY),
      'upperBinId': e.positionData.upperBinId,
      'visible': false,
      'view': 'add',
    }));

    setPositions(pos)
  }

  const fetchActiveBin = async () => {
    const res = await getActiveBin(params.pool);
    if (res.success === false) {
      toast.error("Get Active Bin failed!");
      return;
    }

    const bin: MTActiveBin = {
      'binId': res.response.activeBin.binId,
      'price': res.response.activeBin.price,
      'pricePerToken': res.response.activeBin.pricePerToken,
      'supply': new BN(res.response.activeBin.supply, 16),
      'xAmount': new BN(res.response.activeBin.xAmount, 16),
      'yAmount': new BN(res.response.activeBin.yAmount, 16)
    }

    setActiveBin(bin);
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      await fetchActiveBin();
      await fetchPair_Positions();

      setLoading(false);
    };

    if ( userRole === "ADMIN" )
      fetchData(); // Call the async function
    else
      router.push("/");
  }, [refresh, setRefresh])

  let poolPrice: number = mtPair ? mtPair.current_price : 0;
  let solBalance: number = positions ? positions.length ? positions.map(e => e.totalXAmount).reduce((acc, value) => Number(acc) + Number(value)) : 0 : 0;
  let usdcBalance: number = positions ? positions.length ? positions.map(e => e.totalYAmount).reduce((acc, value) => Number(acc) + Number(value)) : 0 : 0;
  let totalLiquidity: number = Number(solBalance) * poolPrice + Number(usdcBalance);
  let solFee: number = positions ? positions.length ? positions.map(e => e.feeX).reduce((acc, value) => Number(acc) + Number(value)) : 0 : 0;
  let usdcFee: number = positions ? positions.length ? positions.map(e => e.feeY).reduce((acc, value) => Number(acc) + Number(value)) : 0 : 0;
  let totalClaimedFeeXAmount: number = positions ? positions.length ? positions.map(e => e.totalClaimedFeeXAmount).reduce((acc, value) => Number(acc) + Number(value)) : 0 : 0;
  let totalClaimedFeeYAmount: number = positions ? positions.length ? positions.map(e => e.totalClaimedFeeYAmount).reduce((acc, value) => Number(acc) + Number(value)) : 0 : 0;
  let feesEarned: number = totalClaimedFeeXAmount + totalClaimedFeeYAmount;

  return (
    <div className="App">
      <LiquidityInfo poolPrice={Number(poolPrice.toFixed(2))} totalLiquidity={Number(totalLiquidity.toFixed(6))} feesEarned={Number(feesEarned.toFixed(6))} />
      <div className="flex justify-between">
        <Balances solBalance={Number(solBalance.toFixed(6))} usdcBalance={Number(usdcBalance.toFixed(6))} />
        <UnclaimedFees solFee={Number(solFee.toFixed(6))} usdcFee={Number(usdcFee.toFixed(6))} />
      </div>

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
        <Position positions={positions} activeBin={activeBin} mtPair={mtPair} refresh={refresh} setRefresh={setRefresh} />
      )}
    </div>
  );
};