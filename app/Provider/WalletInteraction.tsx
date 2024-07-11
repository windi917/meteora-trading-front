import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

function WalletInteraction() {
  return (
    <div>
      <ToastContainer />
      <div className="flex" style={{ alignItems: 'center' }}>
        <WalletMultiButton />
      </div>
    </div>
  );
};

export default WalletInteraction;
