const Withdraw = () => {
    return (
      <div className="max-w-3xl mx-auto p-4 rounded-lg shadow-md mt-8">
        <div>
          <label className="block text-white-700 font-m font-bold mb-2">
            Percentage to withdraw
          </label>
          <div className="quickButtons">
            <button className="font-s">25%</button>
            <button className="font-s">50%</button>
            <button className="font-s">75%</button>
            <button className="font-s">100%</button>
          </div>
          <div className="flex items-center border-b border-gray-300 py-2 mb-8">
            <input
              className="appearance-none bg-transparent border-none w-full text-white-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
              type="number"
              placeholder="100"
            />
            <span className="text-white-500">%</span>
          </div>
        </div>
        <div className="mb-8">
          <p className="text-white-700 font-m font-bold mb-2">You receive:</p>
          <div className="p-4 border border-gray-300 rounded-lg mb-4 gap-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <img src="https://exponential.imgix.net/icons/assets/SOL_color.jpg?auto=format&fit=max&w=256" alt="SOL" className="w-5 h-5 mr-2" />
                0.000000000 SOL
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="flex items-center">
                <img src="https://exponential.imgix.net/icons/assets/USDC_color.jpg?auto=format&fit=max&w=256" alt="USDC" className="w-5 h-5 mr-2" />
                0.809618 USDC
              </span>
            </div>
          </div>
        </div>
        <button className="w-full bg-black text-white py-2 rounded mb-4">
          Withdraw Liquidity
        </button>
        <button className="w-full border border-gray-300 py-2 rounded">
          Withdraw & Close Position
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">* Claim included</p>
      </div>
    );
  };
  
  export default Withdraw;
  