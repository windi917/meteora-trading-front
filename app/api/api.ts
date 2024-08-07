import axios from "axios";
import { METEORA_API_URL, BACKEND_API_URL, JUPITER_API_URL } from "../config";

export const getUserPositionApi = async (jwtToken: string | null) => {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + `/meteora/userPosition`,
    headers: {
      "Authorization": "Bearer " + jwtToken,
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.request(config);
    return { success: true, response: response.data };
  } catch (error) {
    return { success: false };
  }
}

export const getUserDepositAmountApi = async () => {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + `/meteora/userDepositAmount`,
    headers: {
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.request(config);
    return { success: true, response: response.data };
  } catch (error) {
    return { success: false };
  }
}

export const getPoolDepositRole = async (pool: string) => {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + `/meteora/poolRole?pool=${pool}`,
    headers: {
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.request(config);
    return { success: true, response: response.data };
  } catch (error) {
    return { success: false };
  }
}

export const getTokenPrice = async (symbol: string) => {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: JUPITER_API_URL + `/price?ids=${symbol}`,
    headers: {
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.request(config);
    return { success: true, response: response.data };
  } catch (error) {
    return { success: false };
  }
}

export const getAllPair = async () => {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: METEORA_API_URL + "/pair/all_by_groups?page=0&limit=10000",
    headers: {
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.request(config);
    return { success: true, response: response.data };
  } catch (error) {
    return { success: false };
  }
};

export const getPair = async (pool: string) => {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: METEORA_API_URL + `/pair/${pool}`,
    headers: {
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.request(config);
    return { success: true, response: response.data };
  } catch (error) {
    return { success: false };
  }
};

export const getPositions = async (pool: string) => {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + `/meteora/positions?pool=${pool}`,
    headers: {
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.request(config);
    return { success: true, response: response.data };
  } catch (error) {
    return { success: false };
  }
};

export const getActiveBin = async (pool: string) => {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + `/meteora/activebin?pool=${pool}`,
    headers: {
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.request(config);
    return { success: true, response: response.data };
  } catch (error) {
    return { success: false };
  }
};

export const getBinArrays = async (pool: string, minBinId: number, maxBinId: number) => {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + `/meteora/binArrays?pool=${pool}&minBinId=${minBinId}&maxBinId=${maxBinId}`,
    headers: {
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.request(config);
    return { success: true, response: response.data };
  } catch (error) {
    return { success: false };
  }
};

export const getBinIdByPrice = async (pool: string, price: number) => {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + `/meteora/binId?pool=${pool}&price=${price}`,
    headers: {
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.request(config);
    return { success: true, response: response.data };
  } catch (error) {
    return { success: false };
  }
};

export const getPriceByBinId = async (pool: string, binId: number) => {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + `/meteora/price?pool=${pool}&binId=${binId}`,
    headers: {
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.request(config);
    return { success: true, response: response.data };
  } catch (error) {
    return { success: false };
  }
};

export const getBalances = async (mint: string) => {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + `/meteora/balances?mint=${mint}`,
    headers: {
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.request(config);
    return { success: true, response: response.data };
  } catch (error) {
    return { success: false };
  }
};

export const userDepositApi = async (jwtToken: string | null, user: number, amount: number, depositType: number, txHash: string) => {
  const data = {
    'user': user,
    'amount': amount,
    'depositType': depositType,
    'txHash': txHash
  };

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + "/user/deposit",
    headers: {
      "Authorization": "Bearer " + jwtToken,
      "Content-Type": "application/json"
    },
    data: data,
  };

  try {
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    return { success: false };
  }
}

export const userDepositReduceApi = async (jwtToken: string | null, amount: number, withdrawType: number) => {
  const data = {
    'amount': amount,
    'withdrawType': withdrawType,
  };

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + "/user/reduceDeposit",
    headers: {
      "Authorization": "Bearer " + jwtToken,
      "Content-Type": "application/json"
    },
    data: data,
  };

  try {
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    return { success: false };
  }
}

export const adminWithdrawToUserApi = async (jwtToken: string | null, amount: number, withdrawType: number) => {
  const data = {
    'amount': amount,
    'withdrawType': withdrawType,
  };

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + "/user/withdrawToUser",
    headers: {
      "Authorization": "Bearer " + jwtToken,
      "Content-Type": "application/json"
    },
    data: data,
  };

  try {
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    return { success: false };
  }
}

export const userWithdrawApi = async (jwtToken: string | null, pool: string, reduceAmount: number, withdrawType: number) => {
  const data = {
    'pool': pool,
    'reduceAmount': reduceAmount,
    'withdrawType': withdrawType,
  };

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + "/user/withdraw",
    headers: {
      "Authorization": "Bearer " + jwtToken,
      "Content-Type": "application/json"
    },
    data: data,
  };

  try {
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    return { success: false };
  }
}

export const addPosition = async (jwtToken: string | null, pool: string, strategy: string, xAmount: number, yAmount: number, minBinId: number, maxBinId: number) => {
  const data = {
    'pool': pool,
    'strategy': strategy,
    'xAmount': xAmount,
    'yAmount': yAmount,
    'minBinId': minBinId,
    'maxBinId': maxBinId
  };

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + "/meteora/position/add",
    headers: {
      "Authorization": "Bearer " + jwtToken,
      "Content-Type": "application/json"
    },
    data: data,
  };

  try {
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    return { success: false };
  }
};

export const addLiquidity = async (jwtToken: string | null, pool: string, position: string, strategy: string, xAmount: number, yAmount: number, minBinId: number, maxBinId: number, depositToken: string, depositAmount: number) => {
  const data = {
    'pool': pool,
    'position': position,
    'strategy': strategy,
    'xAmount': xAmount,
    'yAmount': yAmount,
    'minBinId': minBinId,
    'maxBinId': maxBinId,
    'depositToken': depositToken,
    'depositAmount': depositAmount,
  };

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + "/meteora/liquidity/add",
    headers: {
      "Authorization": "Bearer " + jwtToken,
      "Content-Type": "application/json"
    },
    data: data,
  };

  try {
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    return { success: false };
  }
};

export const removeLiquidity = async (jwtToken: string | null, pool: string, position: string, bps: number, shouldClaimAndClose: boolean, swapTo: string) => {
  const data = {
    'pool': pool,
    'position': position,
    'bps': bps,
    'shouldClaimAndClose': shouldClaimAndClose,
    'swapTo': swapTo
  };

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + "/meteora/liquidity/remove",
    headers: {
      "Authorization": "Bearer " + jwtToken,
      "Content-Type": "application/json"
    },
    data: data,
  };

  try {
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    return { success: false };
  }
};

export const closePosition = async (jwtToken: string | null, pool: string, position: string) => {
  const data = {
    'pool': pool,
    'position': position,
  };

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + "/meteora/position/close",
    headers: {
      "Authorization": "Bearer " + jwtToken,
      "Content-Type": "application/json"
    },
    data: data,
  };

  try {
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    return { success: false };
  }
};

export const swapToken = async (jwtToken: string | null, pool: string, amount: number, swapXtoY: boolean) => {
  const data = {
    'pool': pool,
    'amount': amount,
    'swapXtoY': swapXtoY
  };

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + "/meteora/swap",
    headers: {
      "Authorization": "Bearer " + jwtToken,
      "Content-Type": "application/json"
    },
    data: data,
  };

  try {
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    return { success: false };
  }
};

export const claimFee = async (jwtToken: string | null, pool: string, position: string) => {
  const data = {
    'pool': pool,
    'position': position,
  };

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + "/meteora/claim",
    headers: {
      "Authorization": "Bearer " + jwtToken,
      "Content-Type": "application/json"
    },
    data: data,
  };

  try {
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    return { success: false };
  }
};

export const jupiterSwapApi = async (jwtToken: string | null, input: string, output: string, amount: number) => {
  const data = {
    'input': input,
    'output': output,
    'amount': amount
  };

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: BACKEND_API_URL + "/meteora/jupiterswap",
    headers: {
      "Authorization": "Bearer " + jwtToken,
      "Content-Type": "application/json"
    },
    data: data,
  };

  try {
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    return { success: false };
  }
};