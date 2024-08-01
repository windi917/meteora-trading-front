import { PublicKey, Connection } from '@solana/web3.js';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import axios, { AxiosResponse } from "axios";

export const RPC = "https://mainnet.helius-rpc.com/?api-key=f1d5fa66-a4cd-4cb6-a0c3-49c3500e7c0f";
export const connection = new Connection(RPC, "finalized");

export async function getDecimals(mintAddress: string) {
    try {
      const tokenMintAddress = new PublicKey(mintAddress);
      const account = await connection.getParsedAccountInfo(tokenMintAddress);
      const parsedInfo = (account.value?.data as any)?.parsed?.info;
  
      if (parsedInfo) {
        console.log(`Decimals: ${parsedInfo.decimals}`);
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
        if ( !metadata )
            return null;

        const uriPromises: AxiosResponse<any> | { error: any } = await axios.get(metadata.data.uri.replace(/\u0000/g, ""))
            .catch((error) => ({ error }));

        const response = uriPromises as AxiosResponse<any>;
        if ( !response )
            return null;

        return response.data.image;
    } catch (error) {
        return null;
    }
}
