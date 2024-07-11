'use client';

import { useState } from 'react';
import VaultCard from "../components/vaultcard";
import "./portfolio.css";

function Portfolio() {
  const [amount, setAmount] = useState<number | string>(0.1);
  const [isDeposit, setIsDeposit] = useState(true);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setAmount(isNaN(value) ? '' : value);
  };

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
              <option value="ETH">ETH</option>
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
          <button className="deposit-button">
            {isDeposit ? 'Deposit' : 'Withdraw'}
          </button>
        </div>
      </div>
    </main>
  );
}

export default Portfolio;