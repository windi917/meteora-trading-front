import { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { getDailyTotalFundsApi } from "../api/api";

type VaultCardProps = {
  title: string;
  token: string;
  aum: number | undefined;
  annReturn: number | undefined;
  button: boolean;
  width: number;
};

type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    fill: boolean;
    backgroundColor: CanvasGradient | string;
    borderColor: string;
    borderWidth: number;
    pointRadius: number;
  }[];
};

type PriceData = [number, number];

function VaultCard({ title, token, aum, annReturn, button, width }: VaultCardProps) {
  const router = useRouter();
  const chartRef = useRef<any>(null); // Reference to access the chart instance
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });

  const [selectedInterval, setSelectedInterval] = useState<string>('1M'); // Default to 1 month

  const fetchData = async (days: number) => {
    // const tokenToFetch = token === 'defi' ? 'solana' : token;
    // const { data } = await axios.get(`https://api.coingecko.com/api/v3/coins/${tokenToFetch}/market_chart`, {
    //   params: {
    //     vs_currency: 'usd',
    //     days: days,
    //   },
    // });

    // return data;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const result = await getDailyTotalFundsApi(startDate, endDate);
    if (result.success && result.response) {
      console.log("#############", result.response);
      return result.response;
    } else {
      throw new Error("Failed to fetch data");
    }
  };

  useEffect(() => {
    // Helper function to generate date range
    function generateDateRange(start: Date, end: Date): Date[] {
      const dates = [];
      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        dates.push(new Date(dt));
      }
      return dates;
    }

    const getChartData = async () => {
      const days = getDays(selectedInterval);
      const data = await fetchData(days);

      // Reduce the number of points
      // const reducedData = data.prices.filter((_: PriceData, index: number) => index % 5 === 0); // Select every 5th point

      const gradient = chartRef.current
        ? chartRef.current.ctx.createLinearGradient(0, 0, 0, 400)
        : undefined;
      if (gradient) {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(35, 31, 32, 0)');
      }

      // Generate complete date range
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
      const dateRange = generateDateRange(startDate, endDate);

      // Merge existing data with complete date range
      const filledData = dateRange.map(date => {
        const existingEntry = data.find((d: any) => d.date === date.toISOString().split('T')[0]);
        return existingEntry || { date: date.toISOString().split('T')[0], SOL: 0, USDC: 0 };
      });

      console.log("filledData", filledData);
      setChartData({
        labels: filledData.map((e: any) =>
          new Date(e.date).toLocaleDateString()
        ),
        datasets: [
          {
            label: `${token} Price`,
            data: token === 'solana' ? filledData.map((e: any) => e.SOL) : filledData.map((e: any) => e.USDC),
            fill: true, // Fill with gradient
            backgroundColor: gradient || 'rgba(255, 255, 255, 0.1)', // Gradient effect
            borderColor: '#fff', // Solid white line
            borderWidth: 2, // Thicker line
            pointRadius: 0, // No point circles
          },
        ],
      });
    };
    getChartData();
  }, [token, selectedInterval]);

  const getDays = (interval: string) => {
    switch (interval) {
      case '1D':
        return 1;
      case '5D':
        return 5;
      case '1M':
        return 30;
      case '6M':
        return 180;
      case '1Y':
        return 365;
      default:
        return 30;
    }
  };

  const handleIntervalChange = (interval: string) => {
    setSelectedInterval(interval);
  };

  return (
    // 
    // className={`px-6 py-2 ${isDeposit ? 'font-m border-b' : 'font-s'}`}
    <div
      className="vault-card"
      style={width > 0 ? { width: `${width}%` } : {}}
    >
      <h2 className="font-l">{title}</h2>
      <p className="font-s mb-8">Self-managed, auto-rebalancing defi pools.</p>
      <p className="font-m mb-2">{token === 'solana' ? `${aum ? aum.toFixed(2) : 0}SOL` : `$${aum ? aum.toFixed(2) : 0}`}</p>
      <p className="font-s mb-8">Assets Under Management</p>
      <p className="font-m mb-2">{annReturn?.toFixed(2)}%</p>
      <p className="font-s mb-8">Ann. Return</p>
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
          ref={chartRef}
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                display: false, // Hide X-axis
              },
              y: {
                display: false, // Hide Y-axis
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
      {button === true ? (
        <button className="deposit-button" onClick={() => { router.push(`/vaults/${token}`) }}>
          Deposit
        </button>
      ) : null}
    </div>
  );
}

export default VaultCard;
