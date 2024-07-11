import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

type VaultCardProps = {
  title: string;
  token: string;
  aum: number;
  annReturn: number;
  button: boolean;
  width: number;
};

type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    fill: boolean;
    backgroundColor: string;
    borderColor: string;
  }[];
};

type PriceData = [number, number];

function VaultCard({ title, token, aum, annReturn, button, width }: VaultCardProps) {
  const router = useRouter();

  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });

  const [selectedInterval, setSelectedInterval] = useState<string>('1M'); // Default to 1 month

  const fetchData = async (days: string) => {
    const tokenToFetch = token === 'defi' ? 'solana' : token;
    const { data } = await axios.get(`https://api.coingecko.com/api/v3/coins/${tokenToFetch}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: days,
      },
    });
    return data;
  };

  useEffect(() => {
    const getChartData = async () => {
      const data = await fetchData(getDays(selectedInterval));
      setChartData({
        labels: data.prices.map((price: PriceData) =>
          new Date(price[0]).toLocaleDateString()
        ),
        datasets: [
          {
            label: `${token} Price`,
            data: data.prices.map((price: PriceData) => price[1]),
            fill: true,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: '#fff',
          },
        ],
      });
    };
    getChartData();
  }, [token, selectedInterval]);

  const getDays = (interval: string) => {
    switch (interval) {
      case '1D':
        return '1';
      case '5D':
        return '5';
      case '1M':
        return '30';
      case '6M':
        return '180';
      case '1Y':
        return '365';
      default:
        return '30'; // Default to 1 month
    }
  };

  const handleIntervalChange = (interval: string) => {
    setSelectedInterval(interval);
  };

  return (
    <div className="vault-card" style={{width: `${width}%`}}>
      <h2 className="font-l">{title}</h2>
      <p className="font-s mb-8">Self-managed, auto-rebalancing defi pools.</p>
      <div className="flex mb-8">
        <div style={{ textAlign: 'left' }}>
          <p className="font-m">${aum.toLocaleString()}</p>
          <p className="font-s">Assets Under Management</p>
        </div>
        <div className="ml-8" style={{ textAlign: 'left' }}>
          <p className="font-m">{annReturn}%</p>
          <p className="font-s">Ann. Return</p>
        </div>
      </div>
      <div className="time-interval-buttons">
        <button
          className={selectedInterval === '1D' ? 'active' : ''}
          onClick={() => handleIntervalChange('1D')}
        >
          1D
        </button>
        <button
          className={selectedInterval === '5D' ? 'active' : ''}
          onClick={() => handleIntervalChange('5D')}
        >
          5D
        </button>
        <button
          className={selectedInterval === '1M' ? 'active' : ''}
          onClick={() => handleIntervalChange('1M')}
        >
          1M
        </button>
        <button
          className={selectedInterval === '6M' ? 'active' : ''}
          onClick={() => handleIntervalChange('6M')}
        >
          6M
        </button>
        <button
          className={selectedInterval === '1Y' ? 'active' : ''}
          onClick={() => handleIntervalChange('1Y')}
        >
          1Y
        </button>
      </div>

      <div className="chart">
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                ticks: { color: '#fff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
              },
              y: {
                ticks: { color: '#fff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
              },
            },
            plugins: {
              legend: { display: false },
            },
          }}
        />
      </div>
      <div className="card-footer">
        <div className="footer-item">
          <p>Success Fee</p>
          <p>10% of profits</p>
        </div>
        <div className="footer-item">
          <p>Min Lock Up</p>
          <p>1 day</p>
        </div>
      </div>
      { button === true ? (
        <button className="deposit-button" onClick={()=>{router.push("/portfolio")}}>
          Deposit
          </button>
      ) : null}
    </div>
  );
}

export default VaultCard;