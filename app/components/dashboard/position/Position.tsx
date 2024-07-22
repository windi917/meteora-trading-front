import React, { useState } from 'react';
import YourPositions from './YourPositions';
import AddPosition from './AddPosition';
import Swap from './Swap';

function Position() {
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
          {activeTab === 'YourPositions' && <YourPositions />}
          {activeTab === 'AddPosition' && <AddPosition solBalance={1.734695977} usdcBalance={79.282866} />}
          {activeTab === 'Swap' && <Swap />}
        </div>
      </div>
    );
};

export default Position;