'use client';

import { useContext, useState } from 'react';
import { Oval } from "react-loader-spinner";
import VaultCard from "../../components/vaultcard";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAccount,
} from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { ADMIN_WALLET_ADDRESS, DEPOSIT_SOLANA, DEPOSIT_USDC, SOL_DECIMALS, SOL_MINT, USDC_DECIMALS, USDC_MINT, Pool } from '../../config';
import { JwtTokenContext } from '@/app/Provider/JWTTokenProvider';
import { getPair, getPositions, getUserPositionApi, removeLiquidity, userDepositApi, userWithdrawApi, adminWithdrawToUserApi, userDepositReduceApi, adminGetBenefit, getBalances } from '@/app/api/api';
import { connection, debouncedToast } from '@/app/utiles';
import { MeteoraContext } from '@/app/Provider/MeteoraProvider';

function Portfolio({ params }: { params: { portfolio: string } }) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [withdrawPercent, setWithdrawPercent] = useState<number>(0);
  const [isDeposit, setIsDeposit] = useState(true);
  const { jwtToken, userId } = useContext(JwtTokenContext);
  const { solPosition, usdcPosition, userDeposit } = useContext(MeteoraContext);

  const wallet = useWallet();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setAmount(value);
  };

  const handleWithdrawAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setWithdrawPercent(value);
  };

  const handleDeposit = async () => {
    const publicKey = wallet.publicKey;
    if (!publicKey || !wallet.signTransaction || !jwtToken || !userId) {
      debouncedToast("Wallet connect first!", "error");
      return;
    }

    let balance = 0;
    if (params.portfolio === "solana") {
      balance = await connection.getBalance(publicKey) / Math.pow(10, SOL_DECIMALS);
    } else {
      const associatedTokenAddress = await getAssociatedTokenAddress(new PublicKey(USDC_MINT), publicKey);
      const accountInfo = await getAccount(connection, associatedTokenAddress);
      balance = Number(accountInfo.amount) / Math.pow(10, 6);
    }

    if ( amount <= 0 ) {
      debouncedToast("Input deposit amount correctly!", "error");
      return;
    }
    if ( balance < amount ) {
      debouncedToast("Insufficient balance!", "error");
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
            lamports: Math.floor(amount * (10 ** decimals)),
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
            Math.floor(amount * (10 ** decimals))
          )
        );
        transaction = new Transaction().add(...transactionInstructions);
      } catch (error) {
        console.log("Deposit Error! ", error);
        setLoading(false);
        return;
      }
    }

    // Send and confirm the transaction
    try {
      const blockHash = await connection.getLatestBlockhash();
      transaction.feePayer = publicKey;
      transaction.recentBlockhash = blockHash.blockhash;
      const signed = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(
        signed.serialize(),
        { skipPreflight: true }
      );

      const txHash = (await signature).toString();

      const res = await userDepositApi(jwtToken, userId, amount, depositType, txHash);

      debouncedToast("Deposit success!", "success");
      console.log("Deposit Success!: ", txHash);
      setLoading(false);
    } catch (error) {
      debouncedToast("Deposit Error!", "error");
      setLoading(false);
    }
  }

  const handleWithdraw = async () => {
    const amount = tradeFunds * withdrawPercent / 100;

    if (amount <= 0) {
      debouncedToast("Input withdraw amount correctly!", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await getUserPositionApi(jwtToken);
      if (!res.success) {
        setLoading(false);
        debouncedToast("Get User Position Error!", "error");
        return;
      }

      const pools: Pool[] = res.response.pools;
      const sumSol = res.response.sumSol;
      const sumUsdc = res.response.sumUsdc;
      const deposit = res.response.userDeposit;

      let solAnnRate = 0;
      let usdcAnnRate = 0;
      let oriPositionUserSol = sumSol.positionUserSol;
      let oriPositionUserUSDC = sumSol.positionUserUSDC;

      if (sumSol.positionSol > sumSol.totalAmount) {
        solAnnRate = (sumSol.positionSol - sumSol.totalAmount) * 40.0 / 100.0;
        sumSol.positionUserSol -= sumSol.positionUserSol * solAnnRate / sumSol.positionSol;
      }
      if (sumUsdc.positionUSDC > sumUsdc.totalAmount) {
        usdcAnnRate = (sumUsdc.positionUSDC - sumUsdc.totalAmount) * 40.0 / 100.0;
        sumUsdc.positionUserUSDC -= sumUsdc.positionUserUSDC * usdcAnnRate / usdcAnnRate;
      }

      // console.log("----------", pools, sumSol, sumUsdc, deposit, solAnnRate, usdcAnnRate, oriPositionUserSol, oriPositionUserUSDC)

      if (!pools || !sumSol || !sumUsdc || !deposit) {
        setLoading(false);
        debouncedToast("Get User Position Error!", "error");
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
      poolsWithVolumes.sort((a, b) => a.tradeVolume - b.tradeVolume);

      let withdrawUserAmount = amount;
      let adminWithdrawAmount = (params.portfolio === 'solana' ? (solAnnRate * amount / sumSol.positionUserSol) : (usdcAnnRate * amount / sumUsdc.positionUserUsdc));
      let withdrawAmount = params.portfolio === 'solana' ? withdrawUserAmount + adminWithdrawAmount : withdrawUserAmount + adminWithdrawAmount;

      //////////////////////////////////

      if (params.portfolio === 'solana') {
        const trade = sumSol.positionUserSol + deposit.solAmount;
        if (amount > trade) {
          debouncedToast(`Max withdraw amount is ${trade}`, "error");
          setLoading(false);
          return;
        }

        // check admin wallet balance, if ( enough balance ) ? transfer directly admin to user : withdraw meteora and transfer to user
        let userDepositReduceAmount = 0;
        if (deposit.solAmount < withdrawAmount) {
          withdrawAmount = withdrawAmount - deposit.solAmount;
          userDepositReduceAmount = deposit.solAmount;

          for (let i = 0; i < poolsWithVolumes.length; i++) {
            if (poolsWithVolumes[i].pool.positionUserSol <= 0)
              continue;

            let reduceAmount = 0;

            const positions = await getPositions(poolsWithVolumes[i].pool.poolAddress);
            if (positions.success === false) {
              debouncedToast("Get Positions Error!", "error");
              return;
            }

            if (poolsWithVolumes[i].pool.positionUserSol < withdrawAmount) {
              const rate = poolsWithVolumes[i].pool.positionUserSol * 100.0 / poolsWithVolumes[i].pool.positionSol;

              for (let j = 0; j < positions.response.userPositions.length; j++) {
                const removeRes = await removeLiquidity(jwtToken, poolsWithVolumes[i].pool.poolAddress, positions.response.userPositions[j].publicKey, rate, false, 'sol');
              }

              reduceAmount += poolsWithVolumes[i].pool.positionUserSol;
              withdrawAmount -= poolsWithVolumes[i].pool.positionUserSol;
              // await userWithdrawApi(jwtToken, poolsWithVolumes[i].pool.poolAddress, reduceDeposit, 1);
            } else {
              const rate = withdrawAmount * 100.0 / poolsWithVolumes[i].pool.positionSol;

              for (let j = 0; j < positions.response.userPositions.length; j++) {
                const removeRes = await removeLiquidity(jwtToken, poolsWithVolumes[i].pool.poolAddress, positions.response.userPositions[j].publicKey, rate, false, 'sol');
              }

              reduceAmount += withdrawAmount;
              withdrawAmount = 0;
              // await userWithdrawApi(jwtToken, poolsWithVolumes[i].pool.poolAddress, rate, 1);
            }

            const reduceRate = reduceAmount * 100 / sumSol.positionSol;
            await userWithdrawApi(jwtToken, poolsWithVolumes[i].pool.poolAddress, reduceRate, 1);
          }
        } else {
          userDepositReduceAmount = deposit.solAmount;
        }

        if (adminWithdrawAmount > 0) {
          const benefitRes = await adminGetBenefit(jwtToken, adminWithdrawAmount, 1);
          if (benefitRes.success === false) {
            debouncedToast("Withdraw error!", "error");
            setLoading(false);
            return;
          }
        }

        const res = await adminWithdrawToUserApi(jwtToken, amount, 1);
        if (res.success === false) {
          debouncedToast("Withdraw error!", "error");
          setLoading(false);
          return;
        }

        await userDepositReduceApi(jwtToken, userDepositReduceAmount, 1);
        debouncedToast("Withdraw success!", "success");
        setLoading(false);
      } else {
        const trade = sumUsdc.positionUserUSDC + deposit.usdcAmount;
        if (amount > trade) {
          debouncedToast(`Max withdraw amount is ${trade}`, "error");
          setLoading(false);
          return;
        }

        // check admin wallet balance, if ( enough balance ) ? transfer directly admin to user : withdraw meteora and transfer to user
        let userDepositReduceAmount = 0;
        if (deposit.usdcAmount < withdrawAmount) {
          withdrawAmount = withdrawAmount - deposit.usdcAmount;
          userDepositReduceAmount = deposit.usdcAmount;

          for (let i = 0; i < poolsWithVolumes.length; i++) {
            if (poolsWithVolumes[i].pool.positionUserUSDC <= 0)
              continue;

            let reduceAmount = 0;

            const positions = await getPositions(poolsWithVolumes[i].pool.poolAddress);
            if (positions.success === false) {
              debouncedToast("Get Positions Error!", "error");
              return;
            }

            if (poolsWithVolumes[i].pool.positionUserUSDC < withdrawAmount) {
              const rate = poolsWithVolumes[i].pool.positionUserUSDC * 100.0 / poolsWithVolumes[i].pool.positionUSDC;

              for (let j = 0; j < positions.response.userPositions.length; j++) {
                const removeRes = await removeLiquidity(jwtToken, poolsWithVolumes[i].pool.poolAddress, positions.response.userPositions[j].publicKey, rate, false, 'usdc');
              }

              reduceAmount += poolsWithVolumes[i].pool.positionUserUSDC;
              withdrawAmount -= poolsWithVolumes[i].pool.positionUserUSDC;
              // await userWithdrawApi(jwtToken, poolsWithVolumes[i].pool.poolAddress, rate, 2);
            } else {
              const rate = withdrawAmount * 100.0 / poolsWithVolumes[i].pool.positionUSDC;

              for (let j = 0; j < positions.response.userPositions.length; j++) {
                const removeRes = await removeLiquidity(jwtToken, poolsWithVolumes[i].pool.poolAddress, positions.response.userPositions[j].publicKey, rate, false, 'usdc');
              }

              reduceAmount += withdrawAmount;
              withdrawAmount = 0;
              // await userWithdrawApi(jwtToken, poolsWithVolumes[i].pool.poolAddress, rate, 2);
            }

            const reduceRate = reduceAmount * 100 / sumUsdc.positionUSDC;
            await userWithdrawApi(jwtToken, poolsWithVolumes[i].pool.poolAddress, reduceRate, 2);
          }
        } else {
          userDepositReduceAmount = amount;
        }

        if (adminWithdrawAmount > 0) {
          const benefitRes = await adminGetBenefit(jwtToken, adminWithdrawAmount, 2);
          if (benefitRes.success === false) {
            debouncedToast("Withdraw error!", "error");
            setLoading(false);
            return;
          }
        }

        const res = await adminWithdrawToUserApi(jwtToken, amount, 2);
        if (res.success === false) {
          debouncedToast("Withdraw error!", "error");
          setLoading(false);
          return;
        }

        await userDepositReduceApi(jwtToken, userDepositReduceAmount, 2);
        debouncedToast("Withdraw success!", "success");
        setLoading(false);
      }
    } catch (e) {
      debouncedToast("Withdraw error!", "error");
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

  const handleMax = async () => {
    if (isDeposit) {
      if (!wallet.publicKey) {
        debouncedToast("Wallet connect first!", "error");
        return;
      }

      if (params.portfolio === "solana") {
        const balance = await connection.getBalance(wallet.publicKey) / Math.pow(10, SOL_DECIMALS);
        setAmount(balance);
      } else {
        const associatedTokenAddress = await getAssociatedTokenAddress(new PublicKey(USDC_MINT), wallet.publicKey);
        const accountInfo = await getAccount(connection, associatedTokenAddress);
        const usdcBalance = Number(accountInfo.amount) / Math.pow(10, 6);
        setAmount(usdcBalance);
      }
    } else {
      setWithdrawPercent(100);
    }
  }

  const handleHalf = async () => {
    if (isDeposit) {
      if (!wallet.publicKey) {
        debouncedToast("Wallet connect first!", "error");
        return;
      }

      if (params.portfolio === "solana") {
        const balance = await connection.getBalance(wallet.publicKey) / Math.pow(10, SOL_DECIMALS);
        setAmount(balance / 2);
      } else {
        const associatedTokenAddress = await getAssociatedTokenAddress(new PublicKey(USDC_MINT), wallet.publicKey);
        const accountInfo = await getAccount(connection, associatedTokenAddress);
        const usdcBalance = Number(accountInfo.amount) / Math.pow(10, 6);
        setAmount(usdcBalance / 2);
      }
    } else {
      setWithdrawPercent(50);
    }
  }

  return (
    <main className="flex flex-col md:flex-row p-4 md:p-10 gap-6 items-center md:items-start">
      <>
        {params.portfolio === 'solana' ? (
          <VaultCard
            title="SOL High Yield"
            token="solana"
            aum={solPosition?.positionUserSol}
            annReturn={solPosition?.positionUserSol ? (solPosition?.totalAmount ? (solPosition.positionUserSol * 100 / solPosition.totalAmount - 100) : 0) : 0}
            button={false}
            width={100}
          />
        ) : (
          <VaultCard
            title="USDC High Yield"
            token="usd-coin"
            aum={usdcPosition?.positionUserUSDC}
            annReturn={usdcPosition?.positionUserUSDC ? (usdcPosition?.totalAmount ? (usdcPosition.positionUserUSDC * 100 / usdcPosition.totalAmount - 100) : 0) : 0}
            button={false}
            width={100}
          />
        )}
        <div className="w-full md:w-2/3 p-4 md:p-6 rounded-lg shadow-lg flex flex-col items-center md:items-start">
          <div className="w-full mb-4 md:mb-6">
            <div className="flex flex-col md:flex-row justify-between text-center md:text-left">
              <div className="mb-4 md:mb-0">
                <p className="text-sm text-gray-500">Your Position</p>
                <p className="text-xl font-semibold">{params.portfolio === 'solana' ? `${tradeFunds.toFixed(3)}SOL` : `$${tradeFunds.toFixed(3)}`}</p>
              </div>
            </div>
          </div>
          <div className="w-full mb-4 md:mb-10">
            <div className="flex flex-col md:flex-row justify-between text-center md:text-left">
              <div className="mb-4 md:mb-0">
                <p className="text-sm text-gray-500">PnL</p>
                <p className="text-xl font-semibold">{params.portfolio === 'solana' ? `${(tradeFunds - initalDeposit).toFixed(3)}SOL` : `$${(tradeFunds - initalDeposit).toFixed(3)}`}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Initial Investment</p>
                <p className="text-xl font-semibold">{params.portfolio === 'solana' ? `${initalDeposit.toFixed(3)}SOL` : `$${initalDeposit.toFixed(3)}`}</p>
              </div>
            </div>
          </div>

          {/* Toggle Buttons for Deposit/Withdraw */}
          <div className="w-full flex justify-center md:justify-start mb-4 md:mb-6 vault-border-bottom">
            <button
              className={`px-6 py-2 ${isDeposit ? 'font-toggle-active border-b-2' : 'font-toggle'}`}
              onClick={() => setIsDeposit(true)}
            >
              Deposit
            </button>
            <button
              className={`px-6 py-2 ${!isDeposit ? 'font-toggle-active border-b-2' : 'font-toggle'}`}
              onClick={() => setIsDeposit(false)}
            >
              Withdraw
            </button>
          </div>

          {isDeposit ? (
            <div className="w-full">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-medium">Enter Amount</p>
                <div className="quickButtons space-x-2">
                  <button className="px-3 py-1 text-sm bg-black-100 border rounded-md font-s hover:bg-black-500 transition" onClick={handleMax}>
                    MAX
                  </button>
                  <button className="px-3 py-1 text-sm bg-black-100 border rounded-md font-s hover:bg-black-500 transition" onClick={handleHalf}>
                    HALF
                  </button>
                </div>
              </div>
              <div className="flex items-center mb-6 gap-2 w-full vault-border-bottom">
                <div className="w-1/3 px-4 py-2" style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                  {params.portfolio === 'solana' ? (
                    <>
                      <img src="/SOL.svg" alt="SOL" />
                      <p>SOL</p>
                    </>
                  ) : (
                    <>
                      <img src="/USDC.svg" alt="USDC" />
                      <p>USDC</p>
                    </>
                  )}
                  {/* <select className="currencySelect pl-10 pr-4 py-2 border border-r-0 rounded-l-md w-full"> */}
                  {/* <option value="ETH">{params.portfolio}</option> */}
                  {/* </select> */}
                </div>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={handleAmountChange}
                  className="amount px-4 py-2"
                  placeholder="Enter amount"
                />
              </div>
              <button className="deposit-button" onClick={handleDeposit}>
                Deposit
              </button>
            </div>
          ) : (
            <div className="w-full">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-medium">Enter a percentage</p>
                <div className="quickButtons space-x-2">
                  <button className="px-3 py-1 text-sm bg-black-100 border rounded-md font-s hover:bg-black-500 transition" onClick={handleMax}>
                    100%
                  </button>
                  <button className="px-3 py-1 text-sm bg-black-100 border rounded-md font-s hover:bg-black-500 transition" onClick={handleHalf}>
                    50%
                  </button>
                </div>
              </div>
              <div className="flex items-center mb-6 gap-2 w-full vault-border-bottom">
                <input
                  type="number"
                  id="withdrawPercent"
                  value={withdrawPercent}
                  onChange={handleWithdrawAmountChange}
                  className="amount text-2xl py-2"
                  style={{ textAlign: 'right' }}
                  placeholder="Enter amount"
                  min="0"
                  max="100"
                />
                <div className="text-2xl">
                  %
                </div>
              </div>
              <div className="w-full mb-4 md:mb-6">
                <div className="flex flex-col md:flex-row justify-between text-center md:text-left">
                  <div className="mb-4 md:mb-0">
                    <p className="text-sm text-gray-500">Withdrawing</p>
                    <p className="text-l font-semibold">{params.portfolio === 'solana' ? `${(tradeFunds * withdrawPercent / 100).toFixed(3)}SOL` : `$${(tradeFunds * withdrawPercent / 100).toFixed(3)}`}</p>
                  </div>
                  <div className="mb-4 md:mb-0">
                    <p className="text-sm text-gray-500">Success fee(10% of profits)</p>
                    {withdrawPercent === 0 ? (
                      <p className="text-l font-semibold">{params.portfolio === 'solana' ? `0SOL` : `$0`}</p>
                    ) : (
                      <p className="text-l font-semibold">{params.portfolio === 'solana' ? `${((tradeFunds - initalDeposit) / 10).toFixed(3)}SOL` : `$${((tradeFunds - initalDeposit) / 10).toFixed(3)}`}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="w-full mb-4 md:mb-6">
                <div className="flex flex-col md:flex-row justify-between text-center md:text-left">
                  <div className="mb-4 md:mb-0">
                    <p className="text-sm text-gray-500">You will receive</p>
                    {withdrawPercent === 0 ? (
                      <p className="text-2xl font-semibold">{params.portfolio === 'solana' ? `0SOL` : `$0`}</p>
                    ) : (
                      <p className="text-2xl font-semibold">{params.portfolio === 'solana' ? `${(tradeFunds * withdrawPercent / 100 - (tradeFunds - initalDeposit) / 10).toFixed(3)}SOL` : `$${(tradeFunds * withdrawPercent / 100 - (tradeFunds - initalDeposit) / 10).toFixed(3)}`}</p>
                    )}
                  </div>
                </div>
              </div>
              <button className="deposit-button" onClick={handleWithdraw}>
                Withdraw
              </button>
            </div>
          )}

        </div>
      </>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Oval height="80" visible={true} width="80" color="#CCF869" ariaLabel="oval-loading" />
        </div>
      )}
    </main>
  );
}

export default Portfolio;
