import axios from "axios";
import { METEORA_API_URL, BACKEND_API_URL } from "../config";

export const getAllPair = async () => {
    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: METEORA_API_URL + "/pair/all",
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

export const getPair = async () => {
    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: METEORA_API_URL + "/pair",
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
    url: BACKEND_API_URL + `/positions/pool=${pool}}`,
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
    url: BACKEND_API_URL + `/activebin/pool=${pool}`,
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

// export const createVToken = async (jwtToken: string | null, name: string, mint: string, decimals: number) => {
//   const data = {
//     'name': name,
//     'tokenMint': mint,
//     'decimals': decimals.toString()
//   };

//   const config = {
//     method: "post",
//     maxBodyLength: Infinity,
//     url: API_URL + "/vtoken",
//     headers: {
//       "Authorization": "Bearer " + jwtToken,
//       "Content-Type": "application/json"
//     },
//     data: data,
//   };

//   try {
//     await axios.request(config);
//     return { success: true }
//   } catch (error) {
//     return { success: false };
//   }
// };