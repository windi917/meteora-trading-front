import React, { useState } from 'react';
import YourPositions from './YourPositions';
import AddPosition from './AddPosition';
import Swap from './Swap';
import { MTActiveBin, MTPosition, MTPair } from '@/app/config';

interface PositionProps {
  positions: MTPosition[] | undefined;
  activeBin: MTActiveBin | undefined;
  mtPair: MTPair | undefined;
  refresh: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

function Position({ positions, activeBin, mtPair, refresh, setRefresh }: PositionProps) {
    const [activeTab, setActiveTab] = useState('YourPositions');

    return (
      <div className="position">
        <div className="tabs">
          <button 
            className={activeTab === 'YourPositions' ? 'active' : ''} 
            onClick={() => setActiveTab('YourPositions')}
          >
            Your Positions
          </button>
          <button 
            className={activeTab === 'AddPosition' ? 'active' : ''} 
            onClick={() => setActiveTab('AddPosition')}
          >
            Add Position
          </button>
          <button 
            className={activeTab === 'Swap' ? 'active' : ''} 
            onClick={() => setActiveTab('Swap')}
          >
            Swap
          </button>
        </div>
        <div className="tab-content">
          {activeTab === 'YourPositions' && <YourPositions positions={positions} activeBin={activeBin} mtPair={mtPair} refresh={refresh} setRefresh={setRefresh}/>}
          {activeTab === 'AddPosition' && <AddPosition position={undefined} mtPair={mtPair} activeBin={activeBin} refresh={refresh} setRefresh={setRefresh}/>}
          {activeTab === 'Swap' && <Swap mtPair={mtPair} refresh={refresh} setRefresh={setRefresh}/>}
        </div>
      </div>
    );
};

export default Position;