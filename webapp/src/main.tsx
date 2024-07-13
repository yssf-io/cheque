import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { http, WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const config = getDefaultConfig({
  appName: "Cheque Claiming",
  projectId: "154c55bd97004f4320be91936e2d9fbc",
  chains: [sepolia],
  // transports: {
  //   [sepolia.id]: http(
  //     "https://eth-sepolia.g.alchemy.com/v2/4HvmaqDcH1O3ZNkHhtFZA5ydU2rgV9Sl",
  //   ),
  // },
  ssr: false,
});

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <h1 className="text-center mt-12 text-2xl">
        Hello, not much to see here
      </h1>
    ),
  },
  {
    path: "/claim",
    element: <App />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <RouterProvider router={router} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
