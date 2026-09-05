import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SYNAPSE_ABI } from "../abi/synapse";
import { CREATE2_FACTORY, DEPLOY_CALLDATA, SYNAPSE_ADDRESS } from "../lib/create2";
import { botchain } from "../lib/wagmi";
import { isConnectorStubError, sendRawTx, useLiveConnector } from "../lib/wallet";

function short(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function useContractDeployed() {
  const publicClient = usePublicClient({ chainId: botchain.id });
  return useQuery({
    queryKey: ["synapse-bytecode"],
    queryFn: async () => {
      const code = await publicClient!.getBytecode({ address: SYNAPSE_ADDRESS });
      return !!code && code !== "0x";
    },
    enabled: !!publicClient,
    refetchInterval: 6000,
  });
}

function TopBar() {
  const { address, status } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  return (
    <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500" />
        <span className="font-display text-base font-semibold tracking-tight">Synapse</span>
        <span className="ml-2 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-medium text-violet-700">
          BotChain
        </span>
      </div>
      <div className="flex items-center gap-3">
        {status === "connected" ? (
          <>
            {chainId !== botchain.id && (
              <button
                onClick={() => switchChain({ chainId: botchain.id })}
                className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700"
              >
                Switch to BotChain
              </button>
            )}
            <span className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-[#4a4562]">
              {short(address)}
            </span>
            <button
              onClick={() => disconnect()}
              className="text-xs font-medium text-[#8a86a3] underline underline-offset-4"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            disabled={isPending}
            onClick={() => connect({ connector: connectors[0] })}
            className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-violet-300/50 disabled:opacity-60"
          >
            {isPending ? "Connecting…" : "Connect Wallet"}
          </button>
        )}
      </div>
    </header>
  );
}

function InitializeCard() {
  const { address, status } = useAccount();
  const liveConnector = useLiveConnector();
  const { connect, connectors } = useConnect();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function initialize() {
    setErr(null);
    if (!address) return;
    setBusy(true);
    try {
      const hash = await sendRawTx(liveConnector, address as `0x${string}`, CREATE2_FACTORY, DEPLOY_CALLDATA, 0n);
      const publicClient = (window as any).__synapsePublicClient;
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      await queryClient.invalidateQueries({ queryKey: ["synapse-bytecode"] });
    } catch (e) {
      setErr(isConnectorStubError(e) ? "Wallet still reconnecting — try again in a moment." : (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-lg rounded-3xl border border-violet-100 bg-white/80 p-10 text-center shadow-xl shadow-violet-100/60 backdrop-blur">
      <div className="mx-auto mb-6 h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 opacity-90" />
      <h2 className="font-display text-2xl font-semibold">Synapse hasn't woken up here yet</h2>
      <p className="mt-3 text-sm leading-relaxed text-[#4a4562]">
        Nobody has switched it on for BotChain yet. Bring it online — it only needs to happen
        once, and every player afterward joins the same running mind.
      </p>
      {status === "connected" ? (
        <button
          onClick={initialize}
          disabled={busy}
          className="mt-6 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-300/50 disabled:opacity-60"
        >
          {busy ? "Waking Synapse…" : "Initialize Synapse"}
        </button>
      ) : (
        <button
          onClick={() => connect({ connector: connectors[0] })}
          className="mt-6 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-300/50"
        >
          Connect Wallet to Continue
        </button>
      )}
      {err && <p className="mt-4 text-xs text-rose-600">{err}</p>}
    </div>
  );
}

function WeightsBar({ weights, bias }: { weights: readonly bigint[]; bias: bigint }) {
  const max = 500;
  return (
    <div className="flex items-end gap-1.5 h-16">
      {weights.map((w, i) => {
        const v = Number(w);
        const h = Math.min(100, (Math.abs(v) / max) * 100);
        return (
          <div key={i} className="flex flex-1 flex-col items-center justify-end h-full">
            <div
              className={`w-full rounded-t ${v >= 0 ? "bg-violet-500" : "bg-rose-400"}`}
              style={{ height: `${Math.max(h, 4)}%` }}
            />
          </div>
        );
      })}
      <div className="flex flex-1 flex-col items-center justify-end h-full border-l border-dashed border-violet-200 pl-1.5">
        <div
          className={`w-full rounded-t ${bias >= 0n ? "bg-indigo-400" : "bg-rose-300"}`}
          style={{ height: `${Math.max(Math.min(100, (Math.abs(Number(bias)) / max) * 100), 4)}%` }}
        />
      </div>
    </div>
  );
}

function ActiveDapp() {
  const { address, status } = useAccount();
  const liveConnector = useLiveConnector();
  const publicClient = usePublicClient({ chainId: botchain.id });
  const { writeContractAsync } = useWriteContract();
  const [stakeAmount, setStakeAmount] = useState("0.01");
  const [txErr, setTxErr] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    (window as any).__synapsePublicClient = publicClient;
  }, [publicClient]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const contractBase = { address: SYNAPSE_ADDRESS, abi: SYNAPSE_ABI } as const;

  const { data: current, refetch: refetchEpoch } = useReadContract({
    ...contractBase,
    functionName: "currentEpoch",
    query: { refetchInterval: 4000 },
  });

  const { data: weightsData, refetch: refetchWeights } = useReadContract({
    ...contractBase,
    functionName: "getWeights",
    query: { refetchInterval: 6000 },
  });

  const { data: accuracyBps, refetch: refetchAccuracy } = useReadContract({
    ...contractBase,
    functionName: "accuracyBps",
    query: { refetchInterval: 6000 },
  });

  const { data: signal } = useReadContract({
    ...contractBase,
    functionName: "modelSignal",
    query: { refetchInterval: 4000 },
  });

  const { data: totalCount } = useReadContract({
    ...contractBase,
    functionName: "totalCount",
    query: { refetchInterval: 6000 },
  });

  const epochId = current?.[0] ?? 0n;
  const features = current?.[1] ?? [0n, 0n, 0n, 0n, 0n];
  const startTime = current?.[2] ?? 0n;
  const poolYes = current?.[3] ?? 0n;
  const poolNo = current?.[4] ?? 0n;
  const resolved = current?.[5] ?? true;
  const hasEpoch = startTime > 0n;
  const stakeWindowSec = 300;
  const deadlineMs = Number(startTime) * 1000 + stakeWindowSec * 1000;
  const secondsLeft = hasEpoch && !resolved ? Math.max(0, Math.floor((deadlineMs - now) / 1000)) : 0;
  const stakingOpen = hasEpoch && !resolved && secondsLeft > 0;
  const canResolve = hasEpoch && !resolved && secondsLeft === 0;
  const canStart = !hasEpoch || resolved;

  const historyIds = useMemo(() => {
    const ids: bigint[] = [];
    const start = epochId > 5n ? epochId - 4n : 1n;
    for (let i = start; i <= epochId; i++) ids.push(i);
    return ids.reverse();
  }, [epochId]);

  const { data: historyData, refetch: refetchHistory } = useReadContracts({
    contracts: historyIds.map((id) => ({
      ...contractBase,
      functionName: "epochAt",
      args: [id],
    })),
    query: { enabled: historyIds.length > 0, refetchInterval: 6000 },
  });

  async function refetchAll() {
    await Promise.all([refetchEpoch(), refetchWeights(), refetchAccuracy(), refetchHistory()]);
  }

  async function guardedWrite(fn: () => Promise<`0x${string}`>) {
    setTxErr(null);
    try {
      const hash = await fn();
      await publicClient?.waitForTransactionReceipt({ hash });
      await refetchAll();
    } catch (e) {
      setTxErr(isConnectorStubError(e) ? "Wallet still reconnecting — try again in a moment." : (e as Error).message);
    }
  }

  const reconnecting = status === "reconnecting";

  async function onStart() {
    await guardedWrite(() =>
      writeContractAsync({ ...contractBase, functionName: "startEpoch", connector: liveConnector as any })
    );
  }

  async function onResolve() {
    await guardedWrite(() =>
      writeContractAsync({ ...contractBase, functionName: "resolveEpoch", connector: liveConnector as any })
    );
  }

  async function onPredict(sideYes: boolean) {
    let value: bigint;
    try {
      value = parseEther(stakeAmount || "0");
    } catch {
      setTxErr("Enter a valid stake amount.");
      return;
    }
    await guardedWrite(() =>
      writeContractAsync({
        ...contractBase,
        functionName: "predict",
        args: [sideYes],
        value,
        connector: liveConnector as any,
      })
    );
  }

  async function onClaim(id: bigint) {
    await guardedWrite(() =>
      writeContractAsync({ ...contractBase, functionName: "claim", args: [id], connector: liveConnector as any })
    );
  }

  const accuracyPct = accuracyBps ? Number(accuracyBps) / 100 : 0;
  const modelYes = signal?.[1] ?? false;
  const modelScore = signal ? Number(signal[0]) : 0;
  const confidence = Math.min(99, Math.round((Math.abs(modelScore) / 250) * 100));

  return (
    <div className="mx-auto max-w-5xl px-6 pb-24">
      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <div className="rounded-3xl border border-violet-100 bg-white/80 p-6 shadow-lg shadow-violet-100/50 backdrop-blur">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Round #{epochId.toString()}</h3>
            {hasEpoch && !resolved && (
              <span className={`text-xs font-medium ${stakingOpen ? "text-violet-600" : "text-amber-600"}`}>
                {stakingOpen ? `${secondsLeft}s left to stake` : "Ready to resolve"}
              </span>
            )}
          </div>

          {!hasEpoch ? (
            <div className="mt-6 text-center">
              <p className="text-sm text-[#4a4562]">No round is running. Kick one off for everyone.</p>
              <button
                onClick={onStart}
                disabled={reconnecting}
                className="mt-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60"
              >
                Start Round
              </button>
            </div>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-5 gap-2">
                {features.map((f, i) => (
                  <div key={i} className="rounded-xl bg-violet-50 py-3 text-center">
                    <div className="text-[10px] uppercase tracking-wide text-violet-400">p{i + 1}</div>
                    <div className="font-display text-sm font-semibold text-violet-800">{f.toString()}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between text-xs text-[#8a86a3]">
                <span>YES pool: {formatEther(poolYes)} BOT</span>
                <span>NO pool: {formatEther(poolNo)} BOT</span>
              </div>

              {stakingOpen && (
                <div className="mt-5">
                  <label className="text-xs font-medium text-[#4a4562]">Stake amount (BOT)</label>
                  <input
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                  />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => onPredict(true)}
                      disabled={reconnecting || status !== "connected"}
                      className="rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-300/50 disabled:opacity-60"
                    >
                      Back YES
                    </button>
                    <button
                      onClick={() => onPredict(false)}
                      disabled={reconnecting || status !== "connected"}
                      className="rounded-xl bg-rose-400 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-200/60 disabled:opacity-60"
                    >
                      Back NO
                    </button>
                  </div>
                </div>
              )}

              {canResolve && (
                <button
                  onClick={onResolve}
                  disabled={reconnecting}
                  className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60"
                >
                  Resolve Round
                </button>
              )}

              {resolved && canStart && (
                <button
                  onClick={onStart}
                  disabled={reconnecting}
                  className="mt-3 w-full rounded-xl border border-violet-300 py-2.5 text-sm font-semibold text-violet-700 disabled:opacity-60"
                >
                  Start Next Round
                </button>
              )}
            </>
          )}
          {txErr && <p className="mt-4 text-xs text-rose-600">{txErr}</p>}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-violet-100 bg-white/80 p-6 shadow-lg shadow-violet-100/50 backdrop-blur">
            <h3 className="font-display text-lg font-semibold">Synapse's mind</h3>
            <p className="mt-1 text-xs text-[#8a86a3]">
              {totalCount ? `${totalCount.toString()} rounds trained` : "Not trained yet"}
            </p>
            {weightsData && (
              <div className="mt-4">
                <WeightsBar weights={weightsData[0]} bias={weightsData[1]} />
                <div className="mt-1 flex justify-between text-[10px] text-[#8a86a3]">
                  <span>p1</span>
                  <span>p2</span>
                  <span>p3</span>
                  <span>p4</span>
                  <span>p5</span>
                  <span>bias</span>
                </div>
              </div>
            )}
            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm text-[#4a4562]">Accuracy</span>
              <span className="font-display text-xl font-semibold text-violet-700">
                {accuracyPct.toFixed(1)}%
              </span>
            </div>
            {hasEpoch && !resolved && (
              <div className="mt-3 rounded-xl bg-violet-50 p-3 text-center text-sm text-violet-800">
                Synapse currently leans <b>{modelYes ? "YES" : "NO"}</b> (~{confidence}% confidence)
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-violet-100 bg-white/80 p-6 shadow-lg shadow-violet-100/50 backdrop-blur">
            <h3 className="font-display text-lg font-semibold">Recent rounds</h3>
            <div className="mt-4 flex flex-col gap-2">
              {historyIds.length === 0 && <p className="text-sm text-[#8a86a3]">No rounds yet.</p>}
              {historyIds.map((id, idx) => {
                const r = historyData?.[idx]?.result as
                  | readonly [readonly bigint[], bigint, bigint, bigint, boolean, number, bigint]
                  | undefined;
                if (!r) return null;
                const [, , pY, pN, res, label] = r;
                return (
                  <div
                    key={id.toString()}
                    className="flex items-center justify-between rounded-xl border border-violet-100 px-3 py-2 text-sm"
                  >
                    <span className="text-[#4a4562]">#{id.toString()}</span>
                    <span className="text-xs text-[#8a86a3]">
                      {formatEther(pY)} / {formatEther(pN)} BOT
                    </span>
                    {res ? (
                      <span className={`text-xs font-semibold ${label === 1 ? "text-violet-600" : "text-rose-500"}`}>
                        {label === 1 ? "YES won" : "NO won"}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600">open</span>
                    )}
                    {res && address && (
                      <button
                        onClick={() => onClaim(id)}
                        className="text-xs font-medium text-violet-700 underline underline-offset-2"
                      >
                        Claim
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dapp() {
  const { data: deployed, isLoading } = useContractDeployed();

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-[#1b1730]">
      <TopBar />
      {isLoading ? (
        <div className="mt-24 text-center text-sm text-[#8a86a3]">Checking BotChain…</div>
      ) : deployed ? (
        <ActiveDapp />
      ) : (
        <InitializeCard />
      )}
    </div>
  );
}
