'use client';

import { useState } from 'react';
import { Oval } from "react-loader-spinner";
import { toast } from "react-toastify";
import VaultCard from "../../components/vaultcard";
import {
  PublicKey,
  Connection,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import {
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAccount,
} from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { ADMIN_WALLET_ADDRESS, SOL_DECIMALS, SOL_MINT, USDC_DECIMALS, USDC_MINT } from '../../config';

export const QUICKNODE_RPC = "https://mainnet.helius-rpc.com/?api-key=f1d5fa66-a4cd-4cb6-a0c3-49c3500e7c0f";
const solConnection = new Connection(QUICKNODE_RPC);

function Portfolio({ params }: { params: { portfolio: string } }) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number>(0.1);
  const [isDeposit, setIsDeposit] = useState(true);
  const wallet = useWallet();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setAmount(value);
  };

  const handleDeposit = async () => {
    const publicKey = wallet.publicKey;
    if (!publicKey || !wallet.signTransaction) {
      toast.error("Wallet connect first!");
      return;
    }

    setLoading(true);
    const tokenMintAddress = params.portfolio === "solana" ? SOL_MINT : USDC_MINT;
    const decimals = params.portfolio === "solana" ? SOL_DECIMALS : USDC_DECIMALS;

    const mintToken = new PublicKey(tokenMintAddress);
    const recipientAddress = new PublicKey(ADMIN_WALLET_ADDRESS);

    let transaction;
    if (params.portfolio === "solana") {
      try {
        transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: recipientAddress,
            lamports: amount * (10 ** decimals),
          })
        );
      } catch (error) {
        console.log(`Deposit Error! ${error}`);
        setLoading(false);
        return;
      }
    } else {
      try {
        const transactionInstructions: TransactionInstruction[] = [];
        const associatedTokenFrom = await getAssociatedTokenAddress(
          mintToken,
          publicKey
        );
        const fromAccount = await getAccount(solConnection, associatedTokenFrom);
        const associatedTokenTo = await getAssociatedTokenAddress(
          mintToken,
          recipientAddress
        );
        if (!(await solConnection.getAccountInfo(associatedTokenTo))) {
          transactionInstructions.push(
            createAssociatedTokenAccountInstruction(
              publicKey,
              associatedTokenTo,
              recipientAddress,
              mintToken
            )
          );
        }
        transactionInstructions.push(
          createTransferInstruction(
            fromAccount.address, // source
            associatedTokenTo, // dest
            publicKey,
            amount * (10 ** decimals)
          )
        );
        transaction = new Transaction().add(...transactionInstructions);
      } catch (error) {
        console.log(`Deposit Error! ${error}`);
        setLoading(false);
        return;
      }
    }

    // Send and confirm the transaction
    const blockHash = await solConnection.getLatestBlockhash();
    transaction.feePayer = publicKey;
    transaction.recentBlockhash = blockHash.blockhash;
    const signed = await wallet.signTransaction(transaction);
    const signature = await solConnection.sendRawTransaction(
      signed.serialize()
    );

    await solConnection.confirmTransaction(
      {
        blockhash: blockHash.blockhash,
        lastValidBlockHeight: blockHash.lastValidBlockHeight,
        signature: signature,
      },
      "finalized"
    );

    const txHash = (await signature).toString();
    console.log("Deposit Success!: ", txHash);
    setLoading(false);
  }

  const handleWithdraw = async () => {

  }

  return (
    <main className="flex p-10">
      <VaultCard title="SOL High Yield" token="solana" aum={334000} annReturn={27.5} button={false} width={70} />
      <div className="depositContainer">
        <div className="mb-6">
          <p className="font-s">Your Position</p>
          <p className="font-l">$3500</p>
        </div>
        <div className="flex justify-between mb-12">
          <div>
            <p className="font-s">PnL</p>
            <p className="font-l">16.7% / $500</p>
          </div>
          <div>
            <p className="font-s">Initial Investment</p>
            <p className="font-l">$3000</p>
          </div>
        </div>
        <div className="depositTabs">
          <button
            className={isDeposit ? "active font-m" : 'font-s'}
            onClick={() => setIsDeposit(true)}
          >
            Deposit
          </button>
          <button
            className={!isDeposit ? "active font-m" : 'font-s'}
            onClick={() => setIsDeposit(false)}
          >
            Withdraw
          </button>
        </div>
        <div className="depositContent">
          <div className="flex justify-between mb-4">
            <p className="font-s">Enter Amount</p>
            <div className="flex">
              <p className="font-s">3,443 ETH</p>
              <div className="ml-4 quickButtons">
                <button className="font-s">MAX</button>
                <button className="font-s">HALF</button>
              </div>
            </div>
          </div>
          <div className="amountInput">
            <img src="/ETH.svg" alt="ETH" className="currencyIcon" />
            <select className="currencySelect">
              <option value="ETH">{params.portfolio}</option>
              {/* Add more options if needed */}
            </select>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={handleAmountChange}
              className="amount"
            />
          </div>
          {isDeposit ? (
            <button className="deposit-button" onClick={handleDeposit}>
              Deposit
            </button>
          ) : (
            <button className="deposit-button" onClick={handleWithdraw}>
              Withdraw
            </button>
          )}
        </div>
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
    </main>
  );
}

export default Portfolio;