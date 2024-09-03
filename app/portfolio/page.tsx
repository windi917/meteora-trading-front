'use client';

import React, { useState, useEffect, useContext } from "react";
import Link from 'next/link'; 
import { Oval } from "react-loader-spinner";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { JwtTokenContext } from "../Provider/JWTTokenProvider";
import { getMetadataUri, RPC } from "../utiles";
import { PublicKey } from "@solana/web3.js";
import { SOL_MINT, USDC_MINT, Pair, Group } from "../config";
import { MeteoraContext } from "../Provider/MeteoraProvider";
import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { FaAngleDoubleLeft, FaAngleLeft, FaAngleRight, FaAngleDoubleRight } from 'react-icons/fa';  // Import icons

interface PairItemProps {
  pair: Pair;
}

const PairItem: React.FC<PairItemProps> = ({ pair }) => {
  const [metadataUris, setMetadataUris] = useState<{ mint_x: string; mint_y: string }>({ mint_x: '', mint_y: '' });

  useEffect(() => {
    const fetchMetadataUris = async () => {
      if (pair.name.split("-").length === 2) {
        let mintXUri;
        if (pair.mint_x === SOL_MINT)
          mintXUri = 'https://exponential.imgix.net/icons/assets/SOL_color.jpg?auto=format&fit=max&w=256';
        else if (pair.mint_x === USDC_MINT)
          mintXUri = 'https://exponential.imgix.net/icons/assets/USDC_color.jpg?auto=format&fit=max&w=256';
        else mintXUri = await getMetadataUri(new PublicKey(pair.mint_x));

        let mintYUri;
        if (pair.mint_y === SOL_MINT)
          mintYUri = 'https://exponential.imgix.net/icons/assets/SOL_color.jpg?auto=format&fit=max&w=256';
        else if (pair.mint_y === USDC_MINT)
          mintYUri = 'https://exponential.imgix.net/icons/assets/USDC_color.jpg?auto=format&fit=max&w=256';
        else mintYUri = await getMetadataUri(new PublicKey(pair.mint_y));

        setMetadataUris({ mint_x: mintXUri, mint_y: mintYUri });
      }
    };

    fetchMetadataUris();
  }, [pair]);

  return (
    <Link href={`/dashboard/${pair.address}`}>
      <div className="flex flex-col sm:grid sm:grid-cols-6 gap-4 items-center bg-gray-100 hover:bg-gray-200 p-4 mt-2 rounded-lg font-s text-black transition duration-200">
        <div className="flex items-center space-x-2">
          {pair.name.split("-").length === 2 && (
            <>
              <img
                src={metadataUris.mint_x}
                alt={`${pair.name.split(" ")[0]}`}
                className="w-8 h-8 mr-2"
              />
              <img
                src={metadataUris.mint_y}
                alt={`${pair.name.split(" ")[1]}`}
                className="w-8 h-8 mr-2"
              />
            </>
          )}
          {/* Pool name displayed fully in mobile view */}
          <span className="font-semibold text-gray-800 break-words">{pair.name}</span>
        </div>
        <span className="block sm:hidden text-gray-800 mt-2">TVL: ${Number(pair.liquidity).toFixed(2)}</span> {/* Show TVL in mobile view */}
        <span className="hidden sm:block text-gray-500">-</span> {/* Placeholder for Your Deposits */}
        <span className="hidden sm:block text-gray-800">${Number(pair.liquidity).toFixed(2)}</span>
        {pair.trade_volume_24h === 0.0 ? (
          <span className="hidden sm:block text-gray-500">-</span>
        ) : (
          <span className="hidden sm:block text-gray-800">${Number(pair.trade_volume_24h).toFixed(2)}</span>
        )}
        {pair.trade_volume_24h === 0.0 || pair.liquidity === 0.0 ? (
          <span className="hidden sm:block text-gray-500">-</span>
        ) : (
          <span className="hidden sm:block text-gray-800">{Number(pair.fees_24h / pair.liquidity * 100.0).toFixed(2)}%</span>
        )}
        <span className="hidden sm:block text-gray-500">-</span>
      </div>
    </Link>
  );
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [displayedGroups, setDisplayedGroups] = useState<Group[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageSize] = useState<number>(5); // Load 5 groups at a time
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { userRole } = useContext(JwtTokenContext);
  const { portfolioGroups  } = useContext(MeteoraContext);
  const { connected } = useWallet() as WalletContextState & {
    signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  };

  const router = useRouter();

  useEffect(() => {
    const loadJupiterScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://terminal.jup.ag/main-v3.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load script'));
        document.body.appendChild(script);
      });
    };

    const initializeJupiter = async () => {
      await loadJupiterScript();
      await window.Jupiter.init({
        displayMode: "widget",
        endpoint: RPC,
        containerClassName:
          "max-h-[90vh] lg:max-h-[600px] w-full lg:w-[600px] overflow-hidden",
      });
    };

    initializeJupiter();
  }, []);

  useEffect(() => {
    if (portfolioGroups) {
      setTotalPages(Math.ceil(portfolioGroups.length / pageSize));
      setDisplayedGroups(portfolioGroups.slice(0, pageSize));
    }
  }, [userRole, router, pageSize, portfolioGroups ]);

  useEffect(() => {
    handlePageChange(currentPage); // Ensure data is updated on page change
  }, [currentPage, searchQuery]);

  const toggleGroup = (index: number) => {
    const newGroups = [...displayedGroups];
    newGroups[index].expanded = !newGroups[index].expanded;
    setDisplayedGroups(newGroups);
  }

  const handlePageChange = (page: number) => {
    if (!portfolioGroups)
      return;

    setCurrentPage(page);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const filteredGroups = portfolioGroups.map(group => ({
      ...group,
      pairs: group.pairs.filter(pair =>
        pair.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pair.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(group => group.pairs.length > 0);
    setDisplayedGroups(filteredGroups.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(filteredGroups.length / pageSize));
  }

  const handleFirstPage = () => handlePageChange(1);
  const handlePrevPage = () => handlePageChange(Math.max(1, currentPage - 1));
  const handleNextPage = () => handlePageChange(Math.min(totalPages, currentPage + 1));
  const handleLastPage = () => handlePageChange(totalPages);

  // Determine the range of page numbers to display (3 pages around the current page)
  const range = 3;
  const startPage = Math.max(1, currentPage - Math.floor(range / 2));
  const endPage = Math.min(totalPages, startPage + range - 1);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  return !connected ? (
    <div className="container mx-auto p-4">
      <div className="bg-red-100 text-red-600 p-4 rounded-lg text-center">Wallet disconnected! Please connect your wallet.</div>
    </div>
  ) : (
    userRole === "ADMIN" ? (
      <div className="container mx-auto p-4">
        <div className="shadow-md rounded-lg p-4">
          <div className="mb-8 text-xl text-left font-primaryRegular text-gray-700">
            <div className="relative w-full sm:w-1/2 mb-4"> {/* Full width on mobile */}
              <input
                type="text"
                placeholder="Search by pool name or address"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-400 focus:border-blue-400 sm:text-sm text-black placeholder:text-xs sm:placeholder:text-sm" // Adjusted placeholder size
                style={{ backgroundColor: '#E5E7EB' }}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.9 14.32a8 8 0 1 1 1.414-1.414l4.243 4.243a1 1 0 0 1-1.415 1.415l-4.242-4.242zM8 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-2 text-white-600 text-sm font-medium"> {/* Adjust columns on smaller screens */}
            <span>Pool</span>
            <span className="hidden sm:block">Your Deposits</span>
            <span className="hidden sm:block">TVL</span>
            <span className="hidden sm:block">24H Vol</span>
            <span className="hidden sm:block">24hr Fee/TVL</span>
            <span className="hidden sm:block">LM APR</span>
          </div>
          {displayedGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-4">
              <div
                className="bg-gray-200 text-black p-4 rounded-lg cursor-pointer hover:bg-gray-300 transition duration-200"
                onClick={() => toggleGroup(groupIndex)}
              >
                <span className="font-semibold text-gray-800">{group.name} ({group.pairs.length} pools)</span>
              </div>
              {group.expanded && (
                <div className="mt-2">
                  {group.pairs.map((pair: Pair, pairIndex: number) => (
                    <PairItem pair={pair} key={pairIndex} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Updated Pagination Section for Mobile Responsiveness */}
        <div className="flex justify-center mt-8 mb-4 sm:mt-6 sm:mb-8">
          <div className="flex flex-wrap justify-center items-center gap-2 w-full max-w-md"> {/* Centered and Responsive Layout */}
            {/* Conditionally render long or short button labels based on screen size */}
            <button
              onClick={handleFirstPage}
              className={`flex items-center px-2 py-2 text-sm sm:text-base ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'} rounded-full shadow-md transition duration-150`}
              disabled={currentPage === 1}
            >
              <FaAngleDoubleLeft className="mr-1" /> <span className="hidden sm:inline">First</span>
            </button>
            <button
              onClick={handlePrevPage}
              className={`flex items-center px-2 py-2 text-sm sm:text-base ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'} rounded-full shadow-md transition duration-150`}
              disabled={currentPage === 1}
            >
              <FaAngleLeft className="mr-1" /> <span className="hidden sm:inline">Prev</span>
            </button>
            {Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-2 py-1 text-sm sm:text-base ${page === currentPage ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'} rounded-full shadow-md transition duration-150`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={handleNextPage}
              className={`flex items-center px-2 py-2 text-sm sm:text-base ${currentPage === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'} rounded-full shadow-md transition duration-150`}
              disabled={currentPage === totalPages}
            >
              <span className="hidden sm:inline">Next</span> <FaAngleRight className="ml-1" />
            </button>
            <button
              onClick={handleLastPage}
              className={`flex items-center px-2 py-2 text-sm sm:text-base ${currentPage === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'} rounded-full shadow-md transition duration-150`}
              disabled={currentPage === totalPages}
            >
              <span className="hidden sm:inline">Last</span> <FaAngleDoubleRight className="ml-1" />
            </button>
          </div>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <Oval
              height="80"
              visible={true}
              width="80"
              color="#CCF869"
              ariaLabel="oval-loading"
            />
          </div>
        )}
      </div>
    ) : (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 text-red-600 p-4 rounded-lg text-center">Routing Error! Access restricted to admin users.</div>
      </div>
    )
  )
};

export default Dashboard;
