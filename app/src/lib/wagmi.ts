import { http, createConfig } from "wagmi";
import { injected, coinbaseWallet } from "wagmi/connectors";
import { defineChain } from "viem";

export const botchain = defineChain({
  id: 677,
  name: "BotChain",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.botchain.ai"] },
  },
  blockExplorers: {
    default: { name: "BotChain Explorer", url: "https://scan.botchain.ai" },
  },
});

export const wagmiConfig = createConfig({
  chains: [botchain],
  connectors: [
    // Untargeted injected() lets wagmi's EIP-6963 discovery pick the real,
    // live-method-bearing connector for whichever wallet the user has —
    // targeting MetaMask directly loses when multiple wallets race for
    // window.ethereum even though MetaMask is installed and unlocked.
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: "Nous" }),
  ],
  transports: {
    [botchain.id]: http("https://rpc.botchain.ai"),
  },
  ssr: false,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
