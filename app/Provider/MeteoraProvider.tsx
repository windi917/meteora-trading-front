'use client';

import React, { createContext, useState, useEffect, ReactNode, useRef, useContext } from "react";
import { toast } from "react-toastify";
import { Group, MTActiveBin, MTPair, MTPosition, Liquidity, UserDepositPosition, UserDeposit } from "../config";
import { getAllPair, getPair, getPositions, getActiveBin, getTokenPrice, getUserPositionApi } from '../api/api'
import { getDecimals } from "../utiles";
import { BN } from "@coral-xyz/anchor";
import { isEqual } from 'lodash';
import { JwtTokenContext } from "./JWTTokenProvider";

interface MeteoraContextProps {
  pool: string;
  setPool: React.Dispatch<React.SetStateAction<string>>;
  allGroups: Group[] | undefined;
  setAllGroups: React.Dispatch<React.SetStateAction<Group[] | undefined>>;
  mtPair: MTPair | undefined;
  setMTPair: React.Dispatch<React.SetStateAction<MTPair | undefined>>;
  activeBin: MTActiveBin | undefined;
  setActiveBin: React.Dispatch<React.SetStateAction<MTActiveBin | undefined>>;
  positions: MTPosition[] | undefined;
  setPositions: React.Dispatch<React.SetStateAction<MTPosition[] | undefined>>;
  positionLiquidities: Liquidity[] | undefined;
  setPositionLiquidities: React.Dispatch<React.SetStateAction<Liquidity[] | undefined>>;
  solPosition: UserDepositPosition | undefined;
  setSolPosition: React.Dispatch<React.SetStateAction<UserDepositPosition | undefined>>;
  usdcPosition: UserDepositPosition | undefined;
  setUsdcPosition: React.Dispatch<React.SetStateAction<UserDepositPosition | undefined>>;
  userDeposit: UserDeposit | undefined;
  setUserDeposit: React.Dispatch<React.SetStateAction<UserDeposit | undefined>>;
}

// This is just an initial placeholder value
export const MeteoraContext = createContext<MeteoraContextProps>({
  pool: '',
  setPool: () => '',
  allGroups: undefined,
  setAllGroups: () => undefined,
  mtPair: undefined,
  setMTPair: () => undefined,
  activeBin: undefined,
  setActiveBin: () => undefined,
  positions: undefined,
  setPositions: () => undefined,
  positionLiquidities: undefined,
  setPositionLiquidities: () => undefined,
  solPosition: undefined,
  setSolPosition: () => undefined,
  usdcPosition: undefined,
  setUsdcPosition: () => undefined,
  userDeposit: undefined,
  setUserDeposit: () => undefined,
});

interface MeteoraProviderProps {
  children: ReactNode;
}

export const MeteoraProvider: React.FC<MeteoraProviderProps> = ({ children }) => {
  const [pool, setPool] = useState('');
  const [allGroups, setAllGroups] = useState<Group[] | undefined>([]);
  const [mtPair, setMTPair] = useState<MTPair | undefined>();
  const [activeBin, setActiveBin] = useState<MTActiveBin | undefined>();
  const [positions, setPositions] = useState<MTPosition[] | undefined>();
  const [positionLiquidities, setPositionLiquidities] = useState<Liquidity[] | undefined>([]);

  const [solPosition, setSolPosition] = useState<UserDepositPosition>();
  const [usdcPosition, setUsdcPosition] = useState<UserDepositPosition>();
  const [userDeposit, setUserDeposit] = useState<UserDeposit>();

  const { jwtToken } = useContext(JwtTokenContext)
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const positionsRef = useRef<MTPosition[] | undefined>(positions);
  const jwtTokenRef = useRef(jwtToken);

  useEffect(() => {
    jwtTokenRef.current = jwtToken;
  }, [jwtToken]);

  const fetchPairs = async () => {
    const pairs = await getAllPair();
    if (pairs.success === false) {
      toast.error("Get LP Pairs failed!");
      return [];
    }

    return pairs.response.groups;
  }

  const fetchPair_Positions = async () => {
    const pair = await getPair(pool);
    if (pair.success === false) {
      toast.error("Get LP Pairs failed!");
      return;
    }

    setMTPair((prevData) => {
      if (!isEqual(pair.response, prevData)) {
        return pair.response;
      } else {
        return prevData;
      }
    });

    // positions
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

    const pos: MTPosition[] = posRes.response.userPositions.map((e: any) => {
      const one = positionsRef.current?.find(item => item.address === e.publicKey);
      return {
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
        'visible': one ? one.visible : false,
        'view': one ? one.view : 'add',
      }
    });

    const sortedPos = pos.sort((a, b) => {
      const totalA = a.totalXAmount + a.totalYAmount;
      const totalB = b.totalXAmount + b.totalYAmount;
      return totalA - totalB;
    });

    setPositions((prevData) => {
      if (!isEqual(sortedPos, prevData)) {
        return sortedPos;
      } else {
        return prevData;
      }
    });

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

      const xPriceData = xRes.response.data[xSymbol];
      const yPriceData = yRes.response.data[ySymbol];

      if (!xPriceData || !yPriceData) {
        return;
      }

      if (typeof xPriceData.price === 'undefined' || typeof yPriceData.price === 'undefined') {
        return;
      }

      const data = sortedPos.map((e) => ({
        'address': e.address,
        'liquidity': e.totalXAmount * xPriceData.price + e.totalYAmount * yPriceData.price,
        'feeEarned': e.totalClaimedFeeXAmount * xPriceData.price + e.totalClaimedFeeYAmount * yPriceData.price
      }))

      setPositionLiquidities((prevData) => {
        if (!isEqual(data, prevData)) {
          return data;
        } else {
          return prevData;
        }
      });
    }
  }

  const fetchActiveBin = async () => {
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

    // Use functional state update to ensure the latest state
    setActiveBin((prevActiveBin) => {
      if (!isEqual(bin, prevActiveBin)) {
        return bin;
      } else {
        return prevActiveBin;
      }
    });
  }

  useEffect(() => {
    const fetchData = async () => {
      const newGroups = await fetchPairs();
      setAllGroups(newGroups);

      if (pool) {
        await fetchActiveBin();
        await fetchPair_Positions();
      }

      startTimer();
    };

    fetchData();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pool]);

  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  const handleTimer = async () => {
    if (jwtTokenRef.current) {
      const res = await getUserPositionApi(jwtTokenRef.current);
      console.log("#########", res)
      if (res.success) {
        setSolPosition(res.response.sumSol);
        setUsdcPosition(res.response.sumUsdc);
        setUserDeposit(res.response.userDeposit);
      }
    }
    if (pool) {
      fetchActiveBin();
      fetchPair_Positions();
    }
  }

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(handleTimer, 10000);
  }

  return (
    <MeteoraContext.Provider value={{ pool, setPool, allGroups, setAllGroups, mtPair, setMTPair, activeBin, setActiveBin, positions, setPositions, positionLiquidities, setPositionLiquidities, solPosition, setSolPosition, usdcPosition, setUsdcPosition, userDeposit, setUserDeposit }}>
      {children}
    </MeteoraContext.Provider>
  );
};