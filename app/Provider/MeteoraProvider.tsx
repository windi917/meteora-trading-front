'use client';

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { toast } from "react-toastify";
import { getPair, getPositions, getActiveBin } from '../api/api'
import { BN } from "@coral-xyz/anchor";
import { MTActiveBin, MTPair, MTPosition, SOL_MINT } from "../config";
import { getDecimals } from "../utiles";

interface MeteoraContextProps {
  mtPair: MTPair | undefined;
  setMTPair: React.Dispatch<React.SetStateAction<MTPair | undefined>>;
  activeBin: MTActiveBin | undefined;
  setActiveBin: React.Dispatch<React.SetStateAction<MTActiveBin | undefined>>;
  positions: MTPosition[] | undefined;
  setPositions: React.Dispatch<React.SetStateAction<MTPosition[] | undefined>>;
}

// This is just an initial placeholder value
export const MeteoraContext = createContext<MeteoraContextProps>({
  mtPair: undefined,
  setMTPair: () => undefined,
  activeBin: undefined,
  setActiveBin: () => undefined,
  positions: undefined,
  setPositions: () => undefined,
});

interface MeteoraProviderProps {
  children: ReactNode;
}

export const MeteoraProvider: React.FC<MeteoraProviderProps> = ({ children }) => {
  const [mtPair, setMTPair] = useState<MTPair>();
  const [activeBin, setActiveBin] = useState<MTActiveBin>();
  const [positions, setPositions] = useState<MTPosition[]>();

  const fetchPair_Positions = async (pool: string) => {
    const pair = await getPair(pool);
    if (pair.success === false) {
      toast.error("Get LP Pairs failed!");
      return;
    }

    setMTPair(pair.response);

    const posRes = await getPositions(pool);
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
  }

  const fetchActiveBin = async (pool: string) => {
    const res = await getActiveBin(pool);
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

  return (
    <MeteoraContext.Provider value={{ mtPair, setMTPair, activeBin, setActiveBin, positions, setPositions }}>
      {children}
    </MeteoraContext.Provider>
  );
};