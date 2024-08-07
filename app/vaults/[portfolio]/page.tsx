'use client';

import { useContext, useState, useEffect } from 'react';
import { Oval } from "react-loader-spinner";
import { toast } from "react-toastify";
import VaultCard from "../../components/vaultcard";
import {
  PublicKey,
  Connection,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAccount,
} from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { ADMIN_WALLET_ADDRESS, DEPOSIT_SOLANA, DEPOSIT_USDC, SOL_DECIMALS, SOL_MINT, USDC_DECIMALS, USDC_MINT } from '../../config';
import { JwtTokenContext } from '@/app/Provider/JWTTokenProvider';
import { getPair, getPositions, getUserPositionApi, removeLiquidity, userDepositApi, userWithdrawApi, adminWithdrawToUserApi, userDepositReduceApi } from '@/app/api/api';
import { connection } from '@/app/utiles';

interface Pool {
  poolAddress: string;
  positionSOl: number;
  positionUSDC: number;
  positionUserSol: number;
  positionUserUSDC: number;
  sol_usdc: number;
  totalAmount: number;
  userAmount: number;
}

interface UserDepositPosition {
  totalAmount: number,
  userAmount: number,
  positionSol: number,
  positionUSDC: number,
  positionUserSol: number,
  positionUserUSDC: number,
}

interface UserDeposit {
  createAt: string;
  id: number;
  solAmount: number;
  usdcAmount: number;
  user: number;
}

function Portfolio({ params }: { params: { portfolio: string } }) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [isDeposit, setIsDeposit] = useState(true);
  const [solPosition, setSolPosition] = useState<UserDepositPosition>();
  const [usdcPosition, setUsdcPosition] = useState<UserDepositPosition>();
  const [userDeposit, setUserDeposit] = useState<UserDeposit>();
  const { jwtToken, userId } = useContext(JwtTokenContext);
  const wallet = useWallet();

  useEffect(() => {
    const fetchData = async () => {
      const res = await getUserPositionApi(jwtToken);
      if (res.success === false)
        return;

      setSolPosition(res.response.sumSol);
      setUsdcPosition(res.response.sumUsdc);
      setUserDeposit(res.response.userDeposit);
    };

    fetchData(); // Call the async function
  }, [])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setAmount(value);
  };

  const handleDeposit = async () => {
    const publicKey = wallet.publicKey;
    if (!publicKey || !wallet.signTransaction || !jwtToken || !userId) {
      toast.error("Wallet connect first!");
      return;
    }

    setLoading(true);
    const tokenMintAddress = params.portfolio === "solana" ? SOL_MINT : USDC_MINT;
    const decimals = params.portfolio === "solana" ? SOL_DECIMALS : USDC_DECIMALS;

    const mintToken = new PublicKey(tokenMintAddress);
    const recipientAddress = new PublicKey(ADMIN_WALLET_ADDRESS);

    let transaction;
    let depositType;
    if (params.portfolio === "solana") {
      depositType = DEPOSIT_SOLANA;
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
      depositType = DEPOSIT_USDC;
      try {
        const transactionInstructions: TransactionInstruction[] = [];
        const associatedTokenFrom = await getAssociatedTokenAddress(
          mintToken,
          publicKey
        );
        const fromAccount = await getAccount(connection, associatedTokenFrom);
        const associatedTokenTo = await getAssociatedTokenAddress(
          mintToken,
          recipientAddress
        );
        if (!(await connection.getAccountInfo(associatedTokenTo))) {
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
    const blockHash = await connection.getLatestBlockhash();
    transaction.feePayer = publicKey;
    transaction.recentBlockhash = blockHash.blockhash;
    const signed = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(
      signed.serialize()
    );

    // await solConnection.confirmTransaction(
    //   {
    //     blockhash: blockHash.blockhash,
    //     lastValidBlockHeight: blockHash.lastValidBlockHeight,
    //     signature: signature,
    //   },
    //   "finalized"
    // );

    const txHash = (await signature).toString();

    const res = await userDepositApi(jwtToken, userId, amount, depositType, txHash);

    console.log("Deposit Success!: ", txHash);
    setLoading(false);
  }

  const handleWithdraw = async () => {
    if (amount <= 0) {
      toast.error("Input withdraw amount correctly!");
      return;
    }

    setLoading(true);

    try {
      const res = await getUserPositionApi(jwtToken);
      if (!res.success) {
        setLoading(false);
        toast.error("Get User Position Error!");
        return;
      }
  
      const pools: Pool[] = res.response.pools;
      const sumSol = res.response.sumSol;
      const sumUsdc = res.response.sumUsdc;
      const deposit = res.response.userDeposit;
  
      console.log("----------", pools, sumSol, sumUsdc, deposit)
  
      if (!pools || !sumSol || !sumUsdc || !deposit) {
        setLoading(false);
        toast.error("Get User Position Error!");
        return;
      }
  
      //////////////////////////////////////
      let poolsWithVolumes = [];
      for (let i = 0; i < pools.length; i++) {
        const pair = await getPair(pools[i].poolAddress);
        if (pair && pair.success) {
          poolsWithVolumes.push({
            pool: pools[i],
            mint_x: pair.response.mint_x,
            mint_y: pair.response.mint_y,
            tradeVolume: pair.response.trade_volume_24h
          });
        }
      }
      console.log("#################", poolsWithVolumes);
      poolsWithVolumes.sort((a, b) => a.tradeVolume - b.tradeVolume);
  
      let withdrawAmount = amount + 0.5;
      //////////////////////////////////
  
      if (params.portfolio === 'solana') {
        const trade = sumSol.positionUserSol + deposit.solAmount;
        if (amount > trade) {
          toast.error(`Max withdraw amount is ${trade}`);
          setLoading(false);
          return;
        }
  
        // check admin wallet balance, if ( enough balance ) ? transfer directly admin to user : withdraw meteora and transfer to user
        let userDepositReduceAmount = 0;
        if (deposit.solAmount < amount) {
          withdrawAmount = amount - deposit.solAmount;
          userDepositReduceAmount = deposit.solAmount;
  
          for (let i = 0; i < poolsWithVolumes.length; i++) {
            if (poolsWithVolumes[i].pool.positionUserSol <= 0)
              continue;
  
            const positions = await getPositions(poolsWithVolumes[i].pool.poolAddress);
            if (positions.success === false) {
              toast.error("Get Positions Error!");
              return;
            }
  
            console.log("--------------------------", positions)
            if (poolsWithVolumes[i].pool.positionUserSol < withdrawAmount) {
              const rate = poolsWithVolumes[i].pool.positionUserSol * 100.0 / poolsWithVolumes[i].pool.positionSOl;
              console.log("remove step1 : ", rate);
  
              for (let j = 0; j < positions.response.userPositions.length; j++) {
                const removeRes = await removeLiquidity(jwtToken, poolsWithVolumes[i].pool.poolAddress, positions.response.userPositions[j].publicKey, rate, false, 'sol');
                console.log("-----11---", removeRes);
              }
  
              withdrawAmount -= poolsWithVolumes[i].pool.positionUserSol;
  
              const reduceDeposit = poolsWithVolumes[i].pool.positionSOl * rate / 100;
              await userWithdrawApi(jwtToken, poolsWithVolumes[i].pool.poolAddress, reduceDeposit, 1);
            } else {
              const rate = withdrawAmount * 100.0 / poolsWithVolumes[i].pool.positionSOl;
              console.log("remove step2 : ", rate);
  
              for (let j = 0; j < positions.response.userPositions.length; j++) {
                const removeRes = await removeLiquidity(jwtToken, poolsWithVolumes[i].pool.poolAddress, positions.response.userPositions[j].publicKey, rate, false, 'sol');
                console.log("-----22---", removeRes);
              }
  
              withdrawAmount = 0;
  
              const reduceDeposit = poolsWithVolumes[i].pool.positionSOl * rate / 100;
              await userWithdrawApi(jwtToken, poolsWithVolumes[i].pool.poolAddress, reduceDeposit, 1);
            }
          }
        } else {
          userDepositReduceAmount = deposit.solAmount;
        }
  
        const res = await adminWithdrawToUserApi(jwtToken, amount, 1);
        console.log("Withdraw Res : ", res);
        if ( res.success === false ) {
          toast.error('Withdraw error!');
          setLoading(false);
          return;
        }
  
        await userDepositReduceApi(jwtToken, userDepositReduceAmount, 1);
        toast.success('Withdraw success!');
        setLoading(false);
      } else {
        const trade = sumUsdc.positionUserUSDC + deposit.usdcAmount;
        if (amount > trade) {
          toast.error(`Max withdraw amount is ${trade}`);
          setLoading(false);
          return;
        }
  
        // check admin wallet balance, if ( enough balance ) ? transfer directly admin to user : withdraw meteora and transfer to user
        let userDepositReduceAmount = 0;
        if (deposit.usdcAmount < amount) {
          withdrawAmount = amount - deposit.usdcAmount;
          userDepositReduceAmount = deposit.usdcAmount;
  
          for (let i = 0; i < poolsWithVolumes.length; i++) {
            if (poolsWithVolumes[i].pool.positionUserUSDC <= 0)
              continue;
  
            const positions = await getPositions(poolsWithVolumes[i].pool.poolAddress);
            if (positions.success === false) {
              toast.error("Get Positions Error!");
              return;
            }
  
            console.log("--------------------------", positions)
            if (poolsWithVolumes[i].pool.positionUserUSDC < withdrawAmount) {
              const rate = poolsWithVolumes[i].pool.positionUserUSDC * 100.0 / poolsWithVolumes[i].pool.positionUSDC;
              console.log("remove step1 : ", rate);
  
              for (let j = 0; j < positions.response.userPositions.length; j++) {
                const removeRes = await removeLiquidity(jwtToken, poolsWithVolumes[i].pool.poolAddress, positions.response.userPositions[j].publicKey, rate, false, 'usdc');
                console.log("-----11---", removeRes);
              }
  
              withdrawAmount -= poolsWithVolumes[i].pool.positionUserUSDC;
  
              const reduceDeposit = poolsWithVolumes[i].pool.positionUSDC * rate / 100;
              await userWithdrawApi(jwtToken, poolsWithVolumes[i].pool.poolAddress, reduceDeposit, 2);
            } else {
              const rate = withdrawAmount * 100.0 / poolsWithVolumes[i].pool.positionUSDC;
              console.log("remove step2 : ", rate, withdrawAmount, poolsWithVolumes[i].pool.positionUSDC, positions);
  
              for (let j = 0; j < positions.response.userPositions.length; j++) {
                const removeRes = await removeLiquidity(jwtToken, poolsWithVolumes[i].pool.poolAddress, positions.response.userPositions[j].publicKey, rate, false, 'usdc');
                console.log("-----22---", removeRes);
              }
  
              withdrawAmount = 0;
  
              const reduceDeposit = poolsWithVolumes[i].pool.positionUSDC * rate / 100;
              await userWithdrawApi(jwtToken, poolsWithVolumes[i].pool.poolAddress, reduceDeposit, 2);
            }
          }
        } else {
          userDepositReduceAmount = amount;
        }
  
        const res = await adminWithdrawToUserApi(jwtToken, amount, 2);
        console.log("Withdraw Res : ", res);
        if ( res.success === false ) {
          toast.error('Withdraw error!');
          setLoading(false);
          return;
        }
  
        await userDepositReduceApi(jwtToken, userDepositReduceAmount, 2);
        toast.success('Withdraw success!');
        setLoading(false);
      }
    } catch (e) {
      toast.error('Withdraw error!');
      setLoading(false);
    }
  }

  let initalDeposit = 0;
  let tradeFunds = 0;

  if (solPosition && usdcPosition && userDeposit) {
    tradeFunds = params.portfolio === "solana"
      ? solPosition.positionUserSol + userDeposit.solAmount
      : usdcPosition.positionUserUSDC + userDeposit.usdcAmount;
    initalDeposit = params.portfolio === "solana"
      ? solPosition.userAmount + userDeposit.solAmount
      : usdcPosition.userAmount + userDeposit.usdcAmount;
  }

  return (
    <main className="flex p-10">
      <VaultCard title={params.portfolio === 'solana' ? "SOL High Yield" : "USDC High Yield"} token={params.portfolio} aum={334000} annReturn={27.5} button={false} width={70} />
      <div className="depositContainer">
        <div className="mb-6">
          <p className="font-s">Your Position</p>
          <p className="font-l">
            ${tradeFunds.toFixed(2)}
          </p>
        </div>
        <div className="flex justify-between mb-12">
          <div>
            <p className="font-s">PnL</p>
            <p className="font-l">{(tradeFunds - initalDeposit).toFixed(2)}</p>
          </div>
          <div>
            <p className="font-s">Initial Investment</p>
            <p className="font-l">
              ${initalDeposit.toFixed(2)}
            </p>
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
              {/* <p className="font-s">3,443 ETH</p> */}
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