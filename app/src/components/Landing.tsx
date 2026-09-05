import NeuralArt from "./NeuralArt";

export default function Landing({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f7fb] text-[#1b1730]">
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-violet-200/60 blur-3xl animate-drift" />
      <div className="pointer-events-none absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-indigo-200/50 blur-3xl animate-drift-slow" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl animate-drift" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500" />
          <span className="font-display text-lg font-semibold tracking-tight">Synapse</span>
        </div>
        <button
          onClick={onEnter}
          className="rounded-full border border-violet-300/70 bg-white/70 px-5 py-2 text-sm font-medium text-violet-700 backdrop-blur transition hover:border-violet-400 hover:bg-white"
        >
          Enter the Lab
        </button>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-32">
        <section className="grid items-center gap-12 pt-12 md:grid-cols-2 md:pt-20">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium uppercase tracking-wider text-violet-700">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse-dot" />
              Live on BotChain
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              One shared mind.
              <br />
              Trained by everyone
              <br />
              who plays.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-[#4a4562]">
              Synapse is a single perceptron living on-chain. Every round it studies a pattern
              and forms an opinion. You back your own read of it. Correct calls split the pool —
              and every round nudges Synapse's instincts a little further.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={onEnter}
                className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-300/50 transition hover:shadow-violet-400/60"
              >
                Enter the Lab
              </button>
              <a href="#how" className="text-sm font-medium text-[#4a4562] underline underline-offset-4">
                How it thinks
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl border border-violet-100 bg-white/60 p-4 shadow-xl shadow-violet-200/40 backdrop-blur">
              <NeuralArt className="h-auto w-full" />
            </div>
          </div>
        </section>

        <section id="how" className="mt-32 grid gap-8 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Read the pattern",
              d: "Each round, Synapse is shown a fresh five-point pattern nobody has seen before. It has an instinct about what it means — but it isn't telling you outright.",
            },
            {
              n: "02",
              t: "Back your instinct",
              d: "Stake on the call you think is right. Everyone predicting the correct side splits the round's pool, pro-rata to their stake.",
            },
            {
              n: "03",
              t: "Watch it learn",
              d: "Once a round settles, Synapse's weights shift toward the answer that was actually correct. Its running accuracy is public — watch it sharpen, or wobble, round by round.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-violet-100 bg-white/70 p-6 backdrop-blur transition hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100"
            >
              <div className="font-display text-3xl font-semibold text-violet-300">{s.n}</div>
              <div className="mt-3 font-display text-lg font-semibold">{s.t}</div>
              <p className="mt-2 text-sm leading-relaxed text-[#4a4562]">{s.d}</p>
            </div>
          ))}
        </section>

        <section className="mt-32 rounded-3xl border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-10 text-center shadow-lg shadow-violet-100/60">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Synapse doesn't sleep. It just waits for the next round.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[#4a4562]">
            Connect a wallet, back a call, and become part of the model's training data —
            permanently, on-chain, for anyone to verify.
          </p>
          <button
            onClick={onEnter}
            className="mt-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-300/50 transition hover:shadow-violet-400/60"
          >
            Enter the Lab
          </button>
        </section>
      </main>

      <footer className="relative z-10 border-t border-violet-100 py-8 text-center text-xs text-[#8a86a3]">
        Synapse runs entirely on-chain on BotChain. No accounts, no servers holding your funds.
      </footer>
    </div>
  );
}
