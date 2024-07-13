import { useEffect, useState } from "react";
import "./App.css";
import { useSearchParams } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWriteContract } from "wagmi";
import { parseAbi, parseUnits } from "viem";

interface ClaimData {
  to: `0x${string}`;
  signature: `0x${string}`;
  amount: number;
}

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [claimData, setClaimData] = useState<ClaimData | undefined>(undefined);
  const account = useAccount();
  const { writeContract } = useWriteContract();

  const handleClaim = () => {
    if (
      !claimData ||
      !claimData.to ||
      !claimData.signature ||
      !claimData.amount
    )
      return;
    writeContract({
      address: claimData.to,
      abi: parseAbi([
        "function claim(bytes32 signature, uint256 amount) external",
      ]),
      functionName: "claim",
      args: [claimData.signature, parseUnits(claimData.amount.toString(), 6)],
    });
  };

  useEffect(() => {
    console.log(searchParams);
    if (searchParams) {
      const encoded = searchParams.get("data");
      if (!encoded) return;
      console.log({ encoded });

      const { to, signature, amount } = JSON.parse(atob(encoded));
      setClaimData({
        to,
        signature,
        amount: parseFloat(amount),
      });
    }
  }, [searchParams]);

  return (
    <div>
      <h1 className="text-4xl">Cheque Claiming</h1>

      {claimData && (
        <div className="my-24">
          <p className="text-2xl">
            You have {claimData.amount} USDC available to claim!
          </p>

          <div>
            <p className="text-lg mt-12 text-left">
              If you have a mobile wallet
            </p>

            <div className="flex justify-center mt-6">
              {account ? (
                <div>
                  <button
                    onClick={handleClaim}
                    className="border px-6 py-4 bg-blue-400 text-white font-bold rounded-lg"
                  >
                    <p className="text-xl">Claim my {claimData.amount} USDC</p>
                  </button>
                </div>
              ) : (
                <ConnectButton />
              )}
            </div>
          </div>

          <p className="text-lg mt-12 text-left">
            If you want to construct your own transaction
          </p>

          <p className="mt-6">In construction...</p>
        </div>
      )}
    </div>
  );
}

export default App;
