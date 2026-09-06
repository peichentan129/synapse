import NousArt from "./NousArt";

export default function Landing({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0b] text-[#efece4]">
      <div className="pointer-events-none absolute -top-56 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-[#d8b878]/[0.06] blur-3xl animate-drift" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-2xl italic tracking-tight text-[#d8b878]">N</span>
          <span className="font-display text-lg tracking-[0.15em]">NOUS</span>
        </div>
        <button
          onClick={onEnter}
          className="rounded-none border border-[#3a3730] px-5 py-2 text-xs uppercase tracking-[0.15em] text-[#efece4] transition hover:border-[#d8b878] hover:text-[#d8b878]"
        >
          Enter
        </button>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-32">
        <section className="grid items-center gap-16 pt-16 md:grid-cols-2 md:pt-24">
          <div>
            <p className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#9a9484]">
              <span className="h-1 w-1 rounded-full bg-[#d8b878] animate-pulse-dot" />
              Live on BotChain
            </p>
            <h1 className="font-display text-5xl font-medium leading-[1.08] tracking-tight md:text-[3.4rem]">
              A mind honed
              <br />
              by <span className="italic text-[#d8b878]">conviction.</span>
            </h1>
            <p className="mt-7 max-w-md text-[17px] leading-relaxed text-[#b4ae9f]">
              Nous is a single perceptron, kept on-chain, owned by no one. Each round it studies
              a pattern and forms a private judgment. State your read, back it with stake, and
              the room's collective conviction becomes the lesson it learns next.
            </p>
            <div className="mt-10 flex items-center gap-6">
              <button
                onClick={onEnter}
                className="bg-[#d8b878] px-8 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#0a0a0b] transition hover:bg-[#e8c98c]"
              >
                Enter Nous
              </button>
              <a href="#how" className="text-xs uppercase tracking-[0.15em] text-[#9a9484] underline underline-offset-4 hover:text-[#efece4]">
                How it thinks
              </a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="animate-rotate-slow">
              <NousArt className="h-auto w-full" />
            </div>
          </div>
        </section>

        <section id="how" className="mt-40 border-t border-[#221f19]">
          <div className="grid gap-x-12 gap-y-14 pt-16 md:grid-cols-3">
            {[
              {
                n: "I",
                t: "A pattern is drawn",
                d: "Each round, Nous is given a fresh five-point pattern no one has seen. It forms an instinct — but keeps it to itself.",
              },
              {
                n: "II",
                t: "You state your read",
                d: "Stake on the side you believe is correct. Those who read it right divide the round's pool between them, in proportion to conviction.",
              },
              {
                n: "III",
                t: "The lesson lands",
                d: "Once a round settles, Nous's weights shift toward whatever proved true. Its running accuracy is public record — sharpening, or slipping, in the open.",
              },
            ].map((s) => (
              <div key={s.n}>
                <div className="font-display text-sm italic text-[#d8b878]">{s.n}</div>
                <div className="mt-4 font-display text-xl">{s.t}</div>
                <p className="mt-3 text-sm leading-relaxed text-[#9a9484]">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-40 border-t border-[#221f19] pt-16 text-center">
          <h2 className="mx-auto max-w-xl font-display text-3xl font-medium leading-tight tracking-tight">
            It does not sleep. It simply waits for the next pattern.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[15px] text-[#9a9484]">
            Connect a wallet, take a position, and become part of what it learns next — verifiable
            on-chain, forever.
          </p>
          <button
            onClick={onEnter}
            className="mt-9 bg-[#d8b878] px-9 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#0a0a0b] transition hover:bg-[#e8c98c]"
          >
            Enter Nous
          </button>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[#221f19] py-8 text-center text-[11px] uppercase tracking-[0.15em] text-[#605c50]">
        Runs entirely on-chain on BotChain — no accounts, no custody
      </footer>
    </div>
  );
}
