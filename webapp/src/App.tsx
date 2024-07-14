import { useEffect, useState } from "react";
import "./App.css";
import { useSearchParams } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect, useWriteContract } from "wagmi";
import { encodeFunctionData, parseAbi, parseUnits } from "viem";

interface ClaimData {
  to: `0x${string}`;
  signature: `0x${string}`;
  amount: number;
}

function App() {
  const [searchParams, _] = useSearchParams();
  const [claimData, setClaimData] = useState<ClaimData | undefined>(undefined);
  const account = useAccount();
  const { writeContract, error } = useWriteContract();
  const { disconnect } = useDisconnect();

  const handleClaim = () => {
    console.log("handleClaim");
    if (
      !claimData ||
      !claimData.to ||
      !claimData.signature ||
      !claimData.amount
    ) {
      console.log("not everything is defined");
      return;
    }

    const encoded = encodeFunctionData({
      abi: parseAbi([
        "function claim(uint256 amount, bytes memory signature) external",
      ]),
      functionName: "claim",
      args: [parseUnits(claimData.amount.toString(), 6), claimData.signature],
    });
    console.log({ here: encoded });

    console.log("writing tx");
    console.log(claimData.to);
    writeContract({
      address: "0xa8684d7c5450A8eBf9DD6a9B21b810908Ec2EDD3",
      abi: parseAbi([
        "function claim(uint256 amount, bytes memory signature) external",
      ]),
      functionName: "claim",
      args: [parseUnits(claimData.amount.toString(), 6), claimData.signature],
    });
  };

  useEffect(() => {
    if (error) {
      console.log(error);
    }
  }, [error]);

  // useEffect(() => {
  //   if (account) {
  //     console.log({ account });
  //     disconnect();
  //   }
  // }, [account]);

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
              {account.address ? (
                <div>
                  <button
                    onClick={handleClaim}
                    className="border px-6 py-4 bg-blue-400 text-white font-bold rounded-lg"
                  >
                    <p className="text-xl">Claim my {claimData.amount} USDC</p>
                  </button>
                  <button
                    onClick={() => disconnect()}
                    className="border px-6 py-4 bg-red-400 text-white font-bold rounded-lg"
                  >
                    <p className="text-xl">Log out</p>
                  </button>
                </div>
              ) : (
                <ConnectButton />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
