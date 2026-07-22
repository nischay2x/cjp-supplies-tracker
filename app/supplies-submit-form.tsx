"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";

type SupplyItem = "water" | "food" | "prepared_food" | "medical" | "other";

type SubmitState = {
  type: "idle" | "success" | "error";
  message: string;
};

const ITEM_OPTIONS: { value: SupplyItem; label: string }[] = [
  { value: "water", label: "Water" },
  { value: "food", label: "Food" },
  { value: "prepared_food", label: "Prepared Food" },
  { value: "medical", label: "Medical" },
  { value: "other", label: "Other" },
];

const UNIT_DEFINITIONS: Record<SupplyItem, string> = {
  water: "1 unit = enough safe drinking water for 1 average person for 5 hours (about 1-1.5 liters).",
  food: "1 unit = 1 ready-to-eat packaged portion for 1 person with shelf life over 24 hours (for example: 1 biscuit packet, 1 packaged lassi, 1 packaged milk pack, or 1 chips packet).",
  prepared_food: "1 unit = 1 ready-to-eat meal portion for 1 person with a shelf life of less than 24 hours (for example: 1 fresh meal box or 1 pizza).",
  medical: "1 unit = 1 complete basic treatment use for 1 person (for example: 1 first-aid kit use, 1 ORS packet, or one full dressing set).",
  other: "1 unit = 1 clearly countable essential item; if bulk, count how many individual people-use portions it can be split into.",
};

export default function SuppliesSubmitForm() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [item, setItem] = useState<SupplyItem>("food");
  const [units, setUnits] = useState<string>("");
  const [place, setPlace] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<SubmitState>({ type: "idle", message: "" });

  const launchCelebration = () => {
    const colors = ["#e0651e", "#f0823a", "#1f5a2e", "#2d7a45", "#c9a227", "#8b1a1a"];
    const bursts = [0, 500, 1000];

    bursts.forEach((delay) => {
      window.setTimeout(() => {
        confetti({
          particleCount: 22,
          spread: 58,
          startVelocity: 26,
          ticks: 120,
          scalar: 0.85,
          gravity: 0.95,
          origin: { x: 0.2, y: 0.78 },
          colors,
        });

        confetti({
          particleCount: 22,
          spread: 58,
          startVelocity: 26,
          ticks: 120,
          scalar: 0.85,
          gravity: 0.95,
          origin: { x: 0.8, y: 0.78 },
          colors,
        });
      }, delay);
    });
  };

  const canSubmit = useMemo(() => {
    const numericUnits = Number(units);
    return Number.isFinite(numericUnits) && numericUnits >= 1 && numericUnits <= 1000;
  }, [units]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState({ type: "idle", message: "" });

    const numericUnits = Number(units);

    if (!Number.isFinite(numericUnits) || numericUnits < 1 || numericUnits > 1000) {
      setState({
        type: "error",
        message: "Units must be between 1 and 1000.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/supplies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item,
          units: numericUnits,
          ...(place.trim() ? { place: place.trim() } : {}),
        }),
      });

      const result = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        if (response.status === 429) {
          setState({
            type: "error",
            message: result.error || "You have recently submitted. Please try again after some time.",
          });
          return;
        }

        setState({
          type: "error",
          message: result.error || "Unable to submit supply.",
        });
        return;
      }

      setState({
        type: "success",
        message: "Thank you for your support. Your contribution has been recorded.",
      });
      setShowCelebration(true);
      launchCelebration();
      setUnits("");
      setPlace("");
      setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
      setTimeout(() => {
        setIsOpen(false);
      }, 3100);
    } catch {
      setState({
        type: "error",
        message: "Network error while submitting the form.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-(--paper-3) bg-(--paper-2) p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-(--saffron-deep)">Record Your Contribution</h2>
            <p className="mt-1 text-sm text-(--ink-3)">If you sent supplies today, please add it here. Every update helps keep support steady.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setState({ type: "idle", message: "" });
              setIsOpen(true);
            }}
            className="rounded-xl bg-(--green) px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-(--green-2)"
          >
            Add My Contribution
          </button>
        </div>
      </div>

      {showCelebration && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-75 w-[92%] max-w-md -translate-x-1/2 rounded-xl border border-(--gold)/70 bg-(--paper) px-4 py-3 text-center shadow-lg">
          <p className="text-sm font-semibold text-(--green)">Thank you for your support.</p>
          <p className="mt-1 text-xs text-(--ink-2)">Your contribution has been recorded.</p>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" role="dialog" aria-modal="true" aria-labelledby="submit-supply-title">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-(--paper-3) bg-(--paper) p-5 shadow-2xl md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="submit-supply-title" className="text-xl font-semibold text-(--saffron-deep)">Add Your Support</h3>
                <p className="mt-1 text-sm text-(--ink-3)">Tell us what you sent so volunteers can plan daily needs better.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-(--paper-3) px-3 py-1.5 text-sm font-medium text-(--ink-2) transition hover:bg-(--paper-2)"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="item" className="text-sm font-medium text-(--ink-2)">Item</label>
                <select
                  id="item"
                  value={item}
                  onChange={(event) => setItem(event.target.value as SupplyItem)}
                  className="rounded-xl border border-(--paper-3) bg-(--paper) px-3 py-2.5 text-(--ink) outline-none ring-(--saffron-2) transition focus:ring"
                >
                  {ITEM_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="rounded-lg border border-(--gold)/60 bg-(--paper-2) px-3 py-2 text-xs text-(--ink-2)">
                  Unit guide: {UNIT_DEFINITIONS[item]}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="units" className="text-sm font-medium text-(--ink-2)">Units</label>
                <input
                  id="units"
                  type="number"
                  min="1"
                  max="1000"
                  step="1"
                  value={units}
                  onChange={(event) => setUnits(event.target.value)}
                  placeholder="100"
                  className="rounded-xl border border-(--paper-3) bg-(--paper) px-3 py-2.5 text-(--ink) outline-none ring-(--saffron-2) transition focus:ring"
                  required
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label htmlFor="place" className="text-sm font-medium text-(--ink-2)">Place (optional)</label>
                <input
                  id="place"
                  type="text"
                  value={place}
                  onChange={(event) => setPlace(event.target.value)}
                  placeholder="Bilaspur"
                  className="rounded-xl border border-(--paper-3) bg-(--paper) px-3 py-2.5 text-(--ink) outline-none ring-(--saffron-2) transition focus:ring"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || !canSubmit}
                  className="rounded-xl bg-(--saffron) px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-(--saffron-deep) disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Saving..." : "Record Contribution"}
                </button>

                {state.type !== "idle" && (
                  <p className={`text-sm ${state.type === "success" ? "text-emerald-700" : "text-red-700"}`}>
                    {state.message}
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
