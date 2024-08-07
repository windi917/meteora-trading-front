import { PublicKey, Connection } from '@solana/web3.js';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import axios, { AxiosResponse } from "axios";

export const RPC = "https://mainnet.helius-rpc.com/?api-key=f1d5fa66-a4cd-4cb6-a0c3-49c3500e7c0f";
export const connection = new Connection(RPC, "finalized");

export function toDecimalString(num: number): string {
  // Convert the number to a string in fixed-point notation
  let numStr = num.toExponential();

  // Extract the base and exponent
  let [base, exp] = numStr.split('e');
  let expN = parseInt(exp, 10);

  // Parse the base as a float and limit the precision to 2 significant digits
  base = parseFloat(parseFloat(base).toPrecision(2)).toString();

  // Convert back to decimal notation
  const result = parseFloat(`${base}e${expN}`);

  // Check if the number is in scientific notation
  const match = result.toString().match(/^-?(\d+\.?\d*)e([+-]\d+)$/);
  if (match) {
    // Convert the scientific notation to decimal notation
    const base = parseFloat(match[1]);
    const exponent = parseInt(match[2], 10);
    const decimal = base * Math.pow(10, exponent);
    return decimal.toFixed(Math.max(0, -exponent));
  }
  // If not in scientific notation, return the number as is
  return result.toString();
}

export async function getDecimals(mintAddress: string) {
  try {
    const tokenMintAddress = new PublicKey(mintAddress);
    const account = await connection.getParsedAccountInfo(tokenMintAddress);
    const parsedInfo = (account.value?.data as any)?.parsed?.info;

    if (parsedInfo) {
      return { success: true, decimals: parsedInfo.decimals };
    } else {
      console.log("Not a valid SPL token mint");
      return { success: false };
    }
  } catch (err) {
    console.log("Not a valid SPL token mint", err);
    return { success: false };
  }
}

export function getAddress(address: string): string {
  return address.slice(0, 4) + "..." + address.slice(28, 32);
}

const getPDA = async (mint: PublicKey): Promise<PublicKey> => {
  const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

  const [pda] = await PublicKey.findProgramAddress(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID,
  );

  return pda;
};

export const getMetadataPDA = async (mint: PublicKey) => {
  try {
    let tokenmetaPubkey = await getPDA(mint);
    const account = await Metadata.fromAccountAddress(connection, tokenmetaPubkey);
    return account;
  } catch (error) {
  }
};

export const getMetadataUri = async (mint: PublicKey) => {
  try {
    const metadata = await getMetadataPDA(mint);
    if (!metadata)
      return null;

    const uriPromises: AxiosResponse<any> | { error: any } = await axios.get(metadata.data.uri.replace(/\u0000/g, ""))
      .catch((error) => ({ error }));

    const response = uriPromises as AxiosResponse<any>;
    if (!response)
      return null;

    return response.data.image;
  } catch (error) {
    return null;
  }
}
