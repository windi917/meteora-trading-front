import React, { FC, useCallback, useEffect, useContext, useState } from "react";
import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Buffer } from "buffer";
import { BACKEND_API_URL } from "../config";
import { JwtTokenContext } from "../Provider/JWTTokenProvider";
import { debouncedToast } from "../utiles";

const WalletInteraction: FC = () => {
  const { publicKey, connected, signMessage } = useWallet() as WalletContextState & {
    signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  };

  const { setJwtToken, setUserRole, setUserId } = useContext(JwtTokenContext);
  const [isRegistered, setIsRegistered] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Ensure this code only runs on the client
  }, []);

  const handleLogin = useCallback(async () => {
    if (!publicKey || !signMessage) {
      debouncedToast("Wallet not connected or signMessage not available", "error");
      return;
    }

    try {
      const data = JSON.stringify({
        address: publicKey.toBase58(),
      });

      const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: BACKEND_API_URL + "/user/login",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };

      const response = await axios.request(config);

      if (response.data.success == true) {
        setJwtToken(response.data.token);
        setUserRole(response.data.role);
        setUserId(response.data.userId);
        setIsRegistered(true);
      } else {
        setIsRegistered(false);
        handleSignup();
      }
    } catch (error) {
      if (error instanceof Error) {
        debouncedToast("Error logging in: " + error.message, "error");
      } else {
        debouncedToast("Error logging in", "error");
      }
    }
  }, [publicKey, signMessage]);

  useEffect(() => {
    if (publicKey && isClient) {
      handleLogin();
    }
  }, [publicKey, handleLogin, isClient]);

  const handleSignup = useCallback(async () => {
    if (!publicKey || !signMessage) {
      debouncedToast("Wallet not connected or signMessage not available", "error");
      return;
    }

    try {
      const message = new TextEncoder().encode("Sign this message for signup");
      const signedMessage = await signMessage(message);
      const data = JSON.stringify({
        address: publicKey.toBase58(),
        msg: "Sign this message for signup",
        signature: Buffer.from(signedMessage).toString("base64"),
      });

      const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: BACKEND_API_URL + "/user/signup",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };

      await axios.request(config);

      // After successful signup, attempt login again to obtain JWT token
      handleLogin();
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof Error) {
        debouncedToast("Error signing up: " + error.message, "error");
      } else {
        debouncedToast("Error signing up", "error");
      }
    }
  }, [publicKey, signMessage, handleLogin]);

  return (
    <div>
      <div className="flex justify-center items-center flex-col">
        {isClient && <WalletMultiButton />} {/* Default WalletMultiButton */}
        {connected && isRegistered === false ? (
          <button
            className="bg-[#ccf869] border-2 mt-1 border-whitesmoke font-primaryRegular leading-normal py-2 px-6 rounded-3xl text-[0.9em] duration-300 ease-in-out text-black hover:bg-[#bbe759] hover:text-black mt-4"
            onClick={handleSignup}
          >
            Sign Up
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default WalletInteraction;
