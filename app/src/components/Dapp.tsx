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
import { NOUS_ABI } from "../abi/nous";
import { CREATE2_FACTORY, DEPLOY_CALLDATA, NOUS_ADDRESS } from "../lib/create2";
import { botchain } from "../lib/wagmi";
import { isConnectorStubError, sendRawTx, useLiveConnector } from "../lib/wallet";

function short(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function useContractDeployed() {
  const publicClient = usePublicClient({ chainId: botchain.id });
  return useQuery({
    queryKey: ["nous-bytecode"],
    queryFn: async () => {
      const code = await publicClient!.getBytecode({ address: NOUS_ADDRESS });
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
    <header className="relative z-10 mx-auto flex max-w-4xl items-center justify-between px-6 py-7">
      <div className="flex items-center gap-2.5">
        <span className="font-display text-xl italic text-[#d8b878]">N</span>
        <span className="font-display text-base tracking-[0.15em]">NOUS</span>
        <span className="ml-2 border border-[#3a3730] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] text-[#9a9484]">
          BotChain
        </span>
      </div>
      <div className="flex items-center gap-3">
        {status === "connected" ? (
          <>
            {chainId !== botchain.id && (
              <button
                onClick={() => switchChain({ chainId: botchain.id })}
                className="border border-amber-700/50 bg-amber-900/20 px-3 py-1.5 text-[11px] uppercase tracking-wide text-amber-400"
              >
                Switch to BotChain
              </button>
            )}
            <span className="border border-[#3a3730] px-3 py-1.5 text-xs text-[#b4ae9f]">{short(address)}</span>
            <button onClick={() => disconnect()} className="text-[11px] uppercase tracking-wide text-[#605c50] underline underline-offset-4">
              Disconnect
            </button>
          </>
        ) : (
          <button
            disabled={isPending}
            onClick={() => connect({ connector: connectors[0] })}
            className="bg-[#d8b878] px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#0a0a0b] disabled:opacity-60"
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
      const publicClient = (window as any).__nousPublicClient;
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      await queryClient.invalidateQueries({ queryKey: ["nous-bytecode"] });
    } catch (e) {
      setErr(isConnectorStubError(e) ? "Wallet still reconnecting — try again in a moment." : (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-20 max-w-lg border border-[#221f19] bg-[#0e0d0c] p-12 text-center">
      <div className="mx-auto mb-7 h-px w-10 bg-[#d8b878]" />
      <h2 className="font-display text-2xl">Nous has not opened its eyes here</h2>
      <p className="mt-4 text-sm leading-relaxed text-[#9a9484]">
        No one has brought it online for BotChain yet. Do it once, and every player after you
        joins the same running mind.
      </p>
      {status === "connected" ? (
        <button
          onClick={initialize}
          disabled={busy}
          className="mt-8 bg-[#d8b878] px-8 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#0a0a0b] disabled:opacity-60"
        >
          {busy ? "Waking Nous…" : "Initialize Nous"}
        </button>
      ) : (
        <button
          onClick={() => connect({ connector: connectors[0] })}
          className="mt-8 bg-[#d8b878] px-8 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#0a0a0b]"
        >
          Connect Wallet to Continue
        </button>
      )}
      {err && <p className="mt-5 text-xs text-rose-400">{err}</p>}
    </div>
  );
}

function WeightsBar({ weights, bias }: { weights: readonly bigint[]; bias: bigint }) {
  const max = 500;
  return (
    <div className="flex h-16 items-end gap-1.5">
      {weights.map((w, i) => {
        const v = Number(w);
        const h = Math.min(100, (Math.abs(v) / max) * 100);
        return (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end">
            <div
              className={v >= 0 ? "w-full bg-[#d8b878]" : "w-full bg-rose-500/70"}
              style={{ height: `${Math.max(h, 4)}%` }}
            />
          </div>
        );
      })}
      <div className="flex h-full flex-1 flex-col items-center justify-end border-l border-dashed border-[#3a3730] pl-1.5">
        <div
          className={bias >= 0n ? "w-full bg-[#a98955]" : "w-full bg-rose-400/60"}
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
    (window as any).__nousPublicClient = publicClient;
  }, [publicClient]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const contractBase = { address: NOUS_ADDRESS, abi: NOUS_ABI } as const;

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
    <div className="mx-auto max-w-4xl px-6 pb-24">
      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <div className="border border-[#221f19] bg-[#0e0d0c] p-7">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg">Round №{epochId.toString()}</h3>
            {hasEpoch && !resolved && (
              <span className={`text-[11px] uppercase tracking-wide ${stakingOpen ? "text-[#d8b878]" : "text-amber-400"}`}>
                {stakingOpen ? `${secondsLeft}s to state your read` : "Ready to settle"}
              </span>
            )}
          </div>

          {!hasEpoch ? (
            <div className="mt-7 text-center">
              <p className="text-sm text-[#9a9484]">No round is running. Open one for everyone.</p>
              <button
                onClick={onStart}
                disabled={reconnecting}
                className="mt-5 bg-[#d8b878] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#0a0a0b] disabled:opacity-60"
              >
                Start Round
              </button>
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-5 gap-2">
                {features.map((f, i) => (
                  <div key={i} className="border border-[#221f19] py-3 text-center">
                    <div className="text-[9px] uppercase tracking-widest text-[#605c50]">p{i + 1}</div>
                    <div className="font-display text-sm text-[#d8b878]">{f.toString()}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between text-xs text-[#9a9484]">
                <span>YES pool: {formatEther(poolYes)} BOT</span>
                <span>NO pool: {formatEther(poolNo)} BOT</span>
              </div>

              {stakingOpen && (
                <div className="mt-6">
                  <label className="text-[11px] uppercase tracking-wide text-[#9a9484]">Stake (BOT)</label>
                  <input
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="mt-1.5 w-full border border-[#3a3730] bg-transparent px-3 py-2 text-sm text-[#efece4] focus:border-[#d8b878] focus:outline-none"
                  />
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => onPredict(true)}
                      disabled={reconnecting || status !== "connected"}
                      className="border border-[#d8b878] py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#d8b878] transition hover:bg-[#d8b878] hover:text-[#0a0a0b] disabled:opacity-60"
                    >
                      Back Yes
                    </button>
                    <button
                      onClick={() => onPredict(false)}
                      disabled={reconnecting || status !== "connected"}
                      className="border border-[#7a3b3b] py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-rose-400 transition hover:bg-rose-950 disabled:opacity-60"
                    >
                      Back No
                    </button>
                  </div>
                </div>
              )}

              {canResolve && (
                <button
                  onClick={onResolve}
                  disabled={reconnecting}
                  className="mt-6 w-full border border-[#d8b878] py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#d8b878] transition hover:bg-[#d8b878] hover:text-[#0a0a0b] disabled:opacity-60"
                >
                  Settle Round
                </button>
              )}

              {resolved && canStart && (
                <button
                  onClick={onStart}
                  disabled={reconnecting}
                  className="mt-3 w-full border border-[#3a3730] py-2.5 text-xs uppercase tracking-[0.15em] text-[#b4ae9f] disabled:opacity-60"
                >
                  Start Next Round
                </button>
              )}
            </>
          )}
          {txErr && <p className="mt-5 text-xs text-rose-400">{txErr}</p>}
        </div>

        <div className="flex flex-col gap-6">
          <div className="border border-[#221f19] bg-[#0e0d0c] p-7">
            <h3 className="font-display text-lg">Its mind, as it stands</h3>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-[#605c50]">
              {totalCount ? `${totalCount.toString()} rounds absorbed` : "Untrained"}
            </p>
            {weightsData && (
              <div className="mt-5">
                <WeightsBar weights={weightsData[0]} bias={weightsData[1]} />
                <div className="mt-1.5 flex justify-between text-[9px] uppercase tracking-widest text-[#605c50]">
                  <span>p1</span>
                  <span>p2</span>
                  <span>p3</span>
                  <span>p4</span>
                  <span>p5</span>
                  <span>bias</span>
                </div>
              </div>
            )}
            <div className="mt-6 flex items-center justify-between border-t border-[#221f19] pt-5">
              <span className="text-sm text-[#9a9484]">Accuracy</span>
              <span className="font-display text-2xl text-[#d8b878]">{accuracyPct.toFixed(1)}%</span>
            </div>
            {hasEpoch && !resolved && (
              <div className="mt-4 border border-[#221f19] p-3 text-center text-sm text-[#b4ae9f]">
                It currently leans <b className="text-[#d8b878]">{modelYes ? "YES" : "NO"}</b> (~{confidence}%
                confidence)
              </div>
            )}
          </div>

          <div className="border border-[#221f19] bg-[#0e0d0c] p-7">
            <h3 className="font-display text-lg">Recent rounds</h3>
            <div className="mt-5 flex flex-col gap-2">
              {historyIds.length === 0 && <p className="text-sm text-[#605c50]">No rounds yet.</p>}
              {historyIds.map((id, idx) => {
                const r = historyData?.[idx]?.result as
                  | readonly [readonly bigint[], bigint, bigint, bigint, boolean, number, bigint]
                  | undefined;
                if (!r) return null;
                const [, , pY, pN, res, label] = r;
                return (
                  <div key={id.toString()} className="flex items-center justify-between border border-[#221f19] px-3 py-2 text-sm">
                    <span className="text-[#9a9484]">№{id.toString()}</span>
                    <span className="text-xs text-[#605c50]">
                      {formatEther(pY)} / {formatEther(pN)} BOT
                    </span>
                    {res ? (
                      <span className={`text-xs font-semibold ${label === 1 ? "text-[#d8b878]" : "text-rose-400"}`}>
                        {label === 1 ? "YES held" : "NO held"}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-400">open</span>
                    )}
                    {res && address && (
                      <button onClick={() => onClaim(id)} className="text-xs text-[#d8b878] underline underline-offset-2">
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
    <div className="min-h-screen bg-[#0a0a0b] text-[#efece4]">
      <TopBar />
      {isLoading ? (
        <div className="mt-24 text-center text-sm text-[#605c50]">Checking BotChain…</div>
      ) : deployed ? (
        <ActiveDapp />
      ) : (
        <InitializeCard />
      )}
    </div>
  );
}
