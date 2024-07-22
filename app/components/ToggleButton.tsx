import { Dispatch, SetStateAction } from 'react';

interface ToggleButtonProps {
  view: 'add' | 'withdraw';
  onToggle: (view: 'add' | 'withdraw') => void;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ view, onToggle }) => {
  return (
    <div className="flex justify-center">
      <div className="flex border-4 border-blue-500 rounded">
        <button
          className={`px-4 py-2 focus:outline-none ${
            view === 'add' ? 'bg-white text-black' : 'bg-blue-500 text-white'
          }`}
          onClick={() => onToggle('add')}
        >
          Add Liquidity
        </button>
        <button
          className={`px-4 py-2 focus:outline-none ${
            view === 'withdraw' ? 'bg-white text-black' : 'bg-blue-500 text-white'
          }`}
          onClick={() => onToggle('withdraw')}
        >
          Withdraw
        </button>
      </div>
    </div>
  );
};

export default ToggleButton;
