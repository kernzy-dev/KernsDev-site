import { useState } from "react";
import Reveal from "./motion/Reveal";

/**
 * "Bring your own model" — custom-print intake. The customer uploads their own
 * STL/3MF and I quote + print it. Static-site friendly: the form posts to
 * Web3Forms (no backend), which emails me the file + details; my address never
 * ships to the client. Set VITE_WEB3FORMS_KEY (free, public access key) to
 * activate — until then the form shows a friendly "opening soon" state.
 *
 * IP note: we display generic example figures only and the form states the
 * customer must own the rights to what they send — we don't host or sell
 * trademarked characters, the customer supplies their own file.
 */

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined;
const MAX_MB = 8;

type State = "idle" | "sending" | "ok" | "error";

export default function CustomPrint() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = (form.elements.namedItem("attachment") as HTMLInputElement)?.files?.[0];
    if (file && file.size > MAX_MB * 1024 * 1024) {
      setError(`That file is over ${MAX_MB} MB — paste a share link (Drive, WeTransfer) in the notes instead.`);
      setState("error");
      return;
    }
    setState("sending");
    setError("");
    try {
      const data = new FormData(form);
      data.append("access_key", WEB3FORMS_KEY || "");
      data.append("subject", "New custom print request — kernsdev.com");
      const res = await fetch("https://api.web3forms.com/submit", { method: "POST", body: data });
      const json = await res.json();
      if (json.success) {
        setState("ok");
        form.reset();
      } else {
        setError(json.message || "Something went wrong — try again or email me.");
        setState("error");
      }
    } catch {
      setError("Network error — please try again.");
      setState("error");
    }
  }

  return (
    <section id="custom" className="mt-20 border-t border-neutral-900 pt-16">
      <Reveal>
        <p className="section-eyebrow mb-2">Custom prints</p>
        <h2 className="text-3xl md:text-4xl font-bold max-w-2xl">Got your own model? I'll print it.</h2>
        <p className="text-neutral-400 mt-4 max-w-2xl leading-relaxed">
          A mini of your D&amp;D character, a figure you designed, a replacement part, that model
          you found online — you bring the <span className="text-neutral-200">STL or 3MF</span>, I
          bring the Bambu X2D. Multi-color, engineering-grade materials, made to order.
        </p>
      </Reveal>

      {/* Example figures — generic placeholders that say "any model, your call". */}
      <Reveal delay={0.05}>
        <div className="mt-8 flex flex-wrap gap-3">
          {["Characters & minis", "Figures & busts", "Parts & prototypes", "Your model here"].map(
            (label, i) => (
              <span
                key={label}
                className={`text-sm px-4 py-2 rounded-full border ${
                  i === 3
                    ? "border-accent/60 text-accent bg-accent/10"
                    : "border-neutral-800 text-neutral-400 bg-neutral-900/40"
                }`}
              >
                {label}
              </span>
            ),
          )}
        </div>
      </Reveal>

      {/* How it works */}
      <Reveal delay={0.1}>
        <ol className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {[
            ["1", "Upload your file", "Send your STL or 3MF plus what you want — material, color, size, quantity."],
            ["2", "I quote it", "I check it prints cleanly and send a price + lead time. No charge until you approve."],
            ["3", "I print & ship", "Printed on the X2D, quality-checked, and shipped to your door."],
          ].map(([n, t, b]) => (
            <li key={n} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
              <span className="text-accent font-display font-bold text-lg">{n}</span>
              <p className="font-medium text-neutral-200 mt-1">{t}</p>
              <p className="text-neutral-400 mt-1 leading-relaxed">{b}</p>
            </li>
          ))}
        </ol>
      </Reveal>

      {/* Intake form */}
      <Reveal delay={0.15}>
        <div className="mt-10 max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950/60 p-6 md:p-8">
          {!WEB3FORMS_KEY ? (
            <div className="text-center py-6">
              <p className="text-neutral-200 font-medium">Custom uploads are opening soon.</p>
              <p className="text-sm text-neutral-500 mt-2">
                The upload form is being switched on — check back shortly, or grab me on{" "}
                <a href="/#contact" className="text-accent hover:underline">the contact page</a>.
              </p>
            </div>
          ) : state === "ok" ? (
            <div className="text-center py-6">
              <p className="text-emerald-300 font-medium text-lg">Got it — thanks! 🎉</p>
              <p className="text-sm text-neutral-400 mt-2">
                Your file and details are in. I'll review and reply with a quote + lead time.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Your name" name="name" required />
                <Field label="Email" name="email" type="email" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Material" name="material" options={["PLA (standard)", "PLA Silk", "PETG (durable)", "ABS / ASA (heat-resistant)", "Not sure — advise me"]} />
                <Field label="Color(s)" name="color" placeholder="e.g. black, or teal→violet" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Quantity" name="quantity" type="number" placeholder="1" />
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1.5">
                    Model file (STL / 3MF, ≤ {MAX_MB} MB)
                  </label>
                  <input
                    type="file"
                    name="attachment"
                    accept=".stl,.3mf,.obj"
                    className="block w-full text-sm text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-accent file:text-white file:text-sm hover:file:bg-accent-dark"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1.5">
                  Notes (size, finish, or a share link if your file is large)
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:border-accent outline-none"
                  placeholder="Scale it to ~120 mm tall; matte finish; Drive/WeTransfer link if the file's too big…"
                />
              </div>

              {state === "error" && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex items-center justify-between gap-4 pt-1">
                <p className="text-[11px] text-neutral-600 leading-snug max-w-sm">
                  By submitting you confirm you own or have the rights to print this model. I print
                  customer-supplied files; I don't sell licensed characters.
                </p>
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="btn-primary text-sm whitespace-nowrap disabled:opacity-60"
                >
                  {state === "sending" ? "Sending…" : "Send for a quote →"}
                </button>
              </div>
            </form>
          )}
        </div>
      </Reveal>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1.5">
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:border-accent outline-none"
      />
    </div>
  );
}

function Select({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1.5">{label}</label>
      <select
        name={name}
        className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:border-accent outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
