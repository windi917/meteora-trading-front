'use client';

import React, { createContext, useState, useEffect, ReactNode, useRef, useContext } from "react";
import { toast } from "react-toastify";
import { Group, MTActiveBin, MTPair, MTPosition, Liquidity, UserDepositPosition, UserDeposit } from "../config";
import { getAllPair, getPair, getPositions, getActiveBin, getTokenPrice, getUserPositionApi, getPoolPositionApi } from '../api/api'
import { getDecimals } from "../utiles";
import { BN } from "@coral-xyz/anchor";
import { isEqual } from 'lodash';
import { JwtTokenContext } from "./JWTTokenProvider";

interface MeteoraContextProps {
  pool: string;
  setPool: React.Dispatch<React.SetStateAction<string>>;
  allGroups: Group[] | undefined;
  setAllGroups: React.Dispatch<React.SetStateAction<Group[] | undefined>>;
  portfolioGroups: Group[] | undefined;
  setPortfolioGroups: React.Dispatch<React.SetStateAction<Group[] | undefined>>;
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
  totalUSDC: number;
  setTotalUSDC: React.Dispatch<React.SetStateAction<number>>;
  totalSOL: number;
  setTotalSOL: React.Dispatch<React.SetStateAction<number>>;
}

// This is just an initial placeholder value
export const MeteoraContext = createContext<MeteoraContextProps>({
  pool: '',
  setPool: () => '',
  allGroups: undefined,
  setAllGroups: () => undefined,
  portfolioGroups: undefined,
  setPortfolioGroups: () => undefined,
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
  totalSOL: 0,
  setTotalSOL: () => 0,
  totalUSDC: 0,
  setTotalUSDC: () => 0,
});

interface MeteoraProviderProps {
  children: ReactNode;
}

export const MeteoraProvider: React.FC<MeteoraProviderProps> = ({ children }) => {
  const [pool, setPool] = useState('');
  const [allGroups, setAllGroups] = useState<Group[] | undefined>([]);
  const [portfolioGroups, setPortfolioGroups] = useState<Group[] | undefined>([]);
  const [mtPair, setMTPair] = useState<MTPair | undefined>();
  const [activeBin, setActiveBin] = useState<MTActiveBin | undefined>();
  const [positions, setPositions] = useState<MTPosition[] | undefined>();
  const [positionLiquidities, setPositionLiquidities] = useState<Liquidity[] | undefined>([]);

  const [solPosition, setSolPosition] = useState<UserDepositPosition>();
  const [usdcPosition, setUsdcPosition] = useState<UserDepositPosition>();
  const [userDeposit, setUserDeposit] = useState<UserDeposit>();
  const [totalUSDC, setTotalUSDC] = useState<number>(0);
  const [totalSOL, setTotalSOL] = useState<number>(0);

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
      // toast.error("Get LP Pairs failed!");
      return [];
    }

    return pairs.response.groups;
  }

  const fetchPair_Positions = async () => {
    const pair = await getPair(pool);
    if (pair.success === false) {
      // toast.error("Get LP Pairs failed!");
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
      // toast.error("Get Positions failed!");
      return;
    }

    const xRes = await getDecimals(pair.response.mint_x);
    const yRes = await getDecimals(pair.response.mint_y);
    if (!xRes.success || !yRes.success) {
      // toast.error("Get Decimals Error!");
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
        // toast.error("Get Token Price error!");
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
      // toast.error("Get Active Bin failed!");
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

  const getPositionLiquidity = async (pool: string) => {
    const pair = await getPair(pool);
    if (pair.success === false) {
      return;
    }

    const posRes = await getPositions(pool);
    if (posRes.success === false) {
      return;
    }

    const xRes = await getDecimals(pair.response.mint_x);
    const yRes = await getDecimals(pair.response.mint_y);
    if (!xRes.success || !yRes.success) {
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

    // price
    let usdc = 0;
    const symbols = pair.response.name.split('-');
    if (symbols.length === 2) {
      const xSymbol = symbols[0];
      const ySymbol = symbols[1];

      const xRes = await getTokenPrice(xSymbol);
      const yRes = await getTokenPrice(ySymbol);

      if (!xRes.success || !yRes.success) {
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

      const data = sortedPos.reduce((acc, e) => 
        acc + e.totalXAmount * xPriceData.price + e.totalYAmount * yPriceData.price
      , 0);

      usdc = data;
    }

    return usdc;
  }

  useEffect(() => {
    console.log("JWTTOKEN: ", jwtToken);

    const fetchData = async () => {
      const newGroups = await fetchPairs();
      setAllGroups(newGroups);

      const poolPositions = await getPoolPositionApi();

      if (poolPositions.success === false)
        return;

      const poolPositionNames = poolPositions.response.map((e: any) => e.pool);

      const filteredGroups = await Promise.all(
        newGroups.map((group: Group) => {
          // Filter the pairs in the group based on poolPositions
          const filteredPairs = group.pairs.filter((pair) => poolPositionNames.includes(pair.address));

          // Return a new group with the filtered pairs
          return {
            ...group,
            pairs: filteredPairs,
          };
        }).filter((group: Group) => group.pairs.length > 0)
      );

      setPortfolioGroups(filteredGroups);

      //////////////////////////////////////////
      console.log("-----------", poolPositionNames)
      // price

      let usdc = 0;
      let sol = 0;

      for ( let i = 0; i < poolPositionNames.length; i ++ ) {
        const res = await getPositionLiquidity(poolPositionNames[i]);
        console.log(res);
        if (res)
          usdc += res;
      }

      console.log("USDC : ", usdc)

      const xRes = await getTokenPrice("SOL");
      console.log("XRES: ", xRes);
      if (!xRes.success ) {
        return;
      }

      const xPriceData = xRes.response.data["SOL"];

      if (!xPriceData) {
        return;
      }

      if (typeof xPriceData.price === 'undefined' ) {
        return;
      }

      sol = usdc / xPriceData.price;
      console.log("SOL : ", sol)

      setTotalUSDC(usdc);
      setTotalSOL(sol);
      //////////////////////////////////////////

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
  }, [pool, jwtToken]);

  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  const handleTimer = async () => {
    if (jwtTokenRef.current) {
      const res = await getUserPositionApi(jwtTokenRef.current);
      // console.log("#########", res)
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
    <MeteoraContext.Provider value={{ pool, setPool, allGroups, setAllGroups, portfolioGroups, setPortfolioGroups, mtPair, setMTPair, activeBin, setActiveBin, positions, setPositions, positionLiquidities, setPositionLiquidities, solPosition, setSolPosition, usdcPosition, setUsdcPosition, userDeposit, setUserDeposit, totalSOL, setTotalSOL, totalUSDC, setTotalUSDC }}>
      {children}
    </MeteoraContext.Provider>
  );
};