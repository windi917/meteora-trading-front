import React, { useContext, useState } from 'react';
import YourPositions from './YourPositions';
import AddPosition from './AddPosition';
import Swap from './Swap';

function Position() {
  const [activeTab, setActiveTab] = useState('YourPositions');

  return (
    <div className="position md:p-6 rounded-lg shadow-lg">
      {/* Tabs Navigation */}
      <div className="tabs flex flex-col md:flex-row justify-between mb-4 border-b border-gray-300">
        <button
          className={`w-full md:w-auto py-2 px-4 text-sm font-semibold ${
            activeTab === 'YourPositions'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('YourPositions')}
        >
          Your Positions
        </button>
        <button
          className={`w-full md:w-auto py-2 px-4 text-sm font-semibold ${
            activeTab === 'AddPosition'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('AddPosition')}
        >
          Add Position
        </button>
        <button
          className={`w-full md:w-auto py-2 px-4 text-sm font-semibold ${
            activeTab === 'Swap'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('Swap')}
        >
          Swap
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content mt-6">
        {activeTab === 'YourPositions' && <YourPositions />}
        {activeTab === 'AddPosition' && <AddPosition positionAddr="" />}
        {activeTab === 'Swap' && <Swap />}
      </div>
    </div>
  );
}

export default Position;
