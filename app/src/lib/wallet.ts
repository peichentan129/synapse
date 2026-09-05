import { useAccount, useConnect } from "wagmi";
import { encodeFunctionData, type Abi } from "viem";
import { botchain } from "./wagmi";

/**
 * wagmi v2 persists the active connection to storage. On a cold load the
 * stored connector can still be a serialized stub (id/name/type, no methods)
 * until reconnect() swaps in the live instance — calling getChainId() on it
 * throws "connector.getChainId is not a function". Resolve the live instance
 * from useConnect().connectors (always live, EIP-6963 ones included) instead
 * of trusting useAccount().connector directly.
 */
export function useLiveConnector() {
  const { connector } = useAccount();
  const { connectors } = useConnect();
  if (!connector) return undefined;
  return connectors.find((c) => c.id === connector.id) ?? connector;
}

async function getRawProvider(connector: ReturnType<typeof useLiveConnector>) {
  if (!connector) throw new Error("no wallet connected");
  const provider: any = await connector.getProvider();
  return provider;
}

export async function sendRawTx(
  connector: ReturnType<typeof useLiveConnector>,
  from: `0x${string}`,
  to: `0x${string}` | undefined,
  data: `0x${string}`,
  valueWei: bigint
) {
  const provider = await getRawProvider(connector);
  const chainIdHex = await provider.request({ method: "eth_chainId" });
  if (parseInt(chainIdHex, 16) !== botchain.id) {
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${botchain.id.toString(16)}` }],
      });
    } catch {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${botchain.id.toString(16)}`,
            chainName: botchain.name,
            nativeCurrency: botchain.nativeCurrency,
            rpcUrls: botchain.rpcUrls.default.http,
            blockExplorerUrls: [botchain.blockExplorers.default.url],
          },
        ],
      });
    }
  }
  const hash = await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to,
        data,
        value: `0x${valueWei.toString(16)}`,
      },
    ],
  });
  return hash as `0x${string}`;
}

export function encodeCall(abi: Abi, functionName: string, args: readonly unknown[] = []) {
  return encodeFunctionData({ abi, functionName, args });
}

export function isConnectorStubError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return /connector\.\w+ is not a function/.test(msg);
}
