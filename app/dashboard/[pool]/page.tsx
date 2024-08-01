'use client';

import React, { useState, useEffect, useCallback, useContext } from "react";
import LiquidityInfo from '../../components/dashboard/header/LiquidityInfo';
import Balances from '../../components/dashboard/header/Balances';
import UnclaimedFees from '../../components/dashboard/header/UnclaimedFees';
import Position from '../../components/dashboard/position/Position';
import { Oval } from "react-loader-spinner";
import { toast } from "react-toastify";
import { getPair, getPositions, getActiveBin, getTokenPrice } from '../../api/api'
import { MTPair, MTPosition, MTActiveBin, SOL_MINT } from '../../config'
import { BN } from "@coral-xyz/anchor";
import { useRouter } from "next/navigation";
import { JwtTokenContext } from "@/app/Provider/JWTTokenProvider";
import { getDecimals } from "@/app/utiles";

interface Liquidity {
  address: string;
  liquidity: number;
  feeEarned: number;
}

export default function PoolDetail({ params }: { params: { pool: string } }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [mtPair, setMTPair] = useState<MTPair>();
  const [activeBin, setActiveBin] = useState<MTActiveBin>();
  const [positions, setPositions] = useState<MTPosition[]>();
  const [refresh, setRefresh] = useState<boolean>(false);
  const { userRole } = useContext(JwtTokenContext);
  const [_xPrice, setXPrice] = useState(0);
  const [_yPrice, setYPrice] = useState(0);
  const [positionLiquidities, setPositionLiquidities] = useState<Liquidity[]>([]);
  const router = useRouter();

  const fetchPair_Positions = async () => {
    const pair = await getPair(params.pool);
    if (pair.success === false) {
      toast.error("Get LP Pairs failed!");
      return;
    }

    setMTPair(pair.response);

    // positions
    const posRes = await getPositions(params.pool);
    if (posRes.success === false) {
      toast.error("Get Positions failed!");
      return;
    }

    const xRes = await getDecimals(pair.response.mint_x);
    const yRes = await getDecimals(pair.response.mint_y);
    if (!xRes.success || !yRes.success) {
      toast.error("Get Decimals Error!");
      return;
    }

    const decimalX = xRes.decimals;
    const decimalY = yRes.decimals;

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

    // price
    const symbols = pair.response.name.split('-');
    if (symbols.length === 2) {
      const xSymbol = symbols[0];
      const ySymbol = symbols[1];

      const xRes = await getTokenPrice(xSymbol);
      const yRes = await getTokenPrice(ySymbol);

      if (!xRes.success || !yRes.success) {
        toast.error("Get Token Price error!");
        return;
      }

      console.log("--------", xRes, yRes);
      setXPrice(xRes.response.data[xSymbol].price);
      setYPrice(yRes.response.data[ySymbol].price);

      const data = pos.map((e) => ({
        'address': e.address,
        'liquidity': e.totalXAmount * xRes.response.data[xSymbol].price + e.totalYAmount * yRes.response.data[ySymbol].price,
        'feeEarned': e.totalClaimedFeeXAmount * xRes.response.data[xSymbol].price + e.totalClaimedFeeYAmount * yRes.response.data[ySymbol].price
      }))

      setPositionLiquidities(data);
    }
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

    if (userRole === "ADMIN")
      fetchData(); // Call the async function
    else
      router.push("/");
  }, [refresh, setRefresh])

  let poolPrice: number = mtPair ? mtPair.current_price : 0;
  let xBalance: number = positions ? positions.length ? positions.map(e => e.totalXAmount).reduce((acc, value) => Number(acc) + Number(value)) : 0 : 0;
  let yBalance: number = positions ? positions.length ? positions.map(e => e.totalYAmount).reduce((acc, value) => Number(acc) + Number(value)) : 0 : 0;
  let totalLiquidity: number = positionLiquidities ? positionLiquidities.length ? positionLiquidities.map(e => e.liquidity).reduce((acc, value) => Number(acc) + Number(value)) : 0 : 0;
  let xFee: number = positions ? positions.length ? positions.map(e => e.feeX).reduce((acc, value) => Number(acc) + Number(value)) : 0 : 0;
  let yFee: number = positions ? positions.length ? positions.map(e => e.feeY).reduce((acc, value) => Number(acc) + Number(value)) : 0 : 0;
  let feesEarned: number = positionLiquidities ? positionLiquidities.length ? positionLiquidities.map(e => e.feeEarned).reduce((acc, value) => Number(acc) + Number(value)) : 0 : 0;

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
          <LiquidityInfo mtPair={mtPair} poolPrice={Number(poolPrice.toFixed(2))} totalLiquidity={Number(totalLiquidity.toFixed(6))} feesEarned={Number(feesEarned.toFixed(6))} />
          <div className="flex justify-between">
            <Balances mtPair={mtPair} xBalance={Number(xBalance.toFixed(6))} yBalance={Number(yBalance.toFixed(6))} />
            <UnclaimedFees mtPair={mtPair} xFee={Number(xFee.toFixed(6))} yFee={Number(yFee.toFixed(6))} />
          </div>
          <Position positions={positions} activeBin={activeBin} mtPair={mtPair} refresh={refresh} setRefresh={setRefresh} />
        </>
      )}
    </div>
  );
};