import SuppliesSubmitForm from "./supplies-submit-form";

export const revalidate = 10;

type SupplyKeys = "water" | "food" | "prepared_food" | "medical" | "other";

type Supply = {
  key: SupplyKeys;
  value: number;
}

async function getData(date?: string): Promise<{ supplies: Supply[] }> {
  const res = await fetch(`${process.env.API_BASE}/supplies${date ? `?date=${date}` : ""}`, {
    headers: {
      "x-api-key": process.env.API_KEY || "",
    },
  });

  if (!res.ok) {
    return {
      supplies: [] as Supply[],
    } 
  }

  const data = await res.json();
  return {
    supplies: data.supplies as Supply[],
  };
}

type Props = {
  searchParams: Promise<{
    date: string;
  }>
}

const SUPPLY_ORDER: SupplyKeys[] = [
  "water",
  "food",
  "prepared_food",
  "medical",
  "other",
];

const SUPPLY_LABELS: Record<SupplyKeys, string> = {
  water: "Water",
  food: "Food",
  prepared_food: "Prepared Food",
  medical: "Medical",
  other: "Other",
};

const todayISO = new Date().toISOString().slice(0, 10);

export default async function Home({ searchParams }: Props) {

  const sparams = await searchParams;
  const selectedDate = sparams.date ?? "";

  // if sparams.date is provided and is not YYYY-MM-DD, return an error message
  if (selectedDate && !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    return (
      <main className="min-h-screen bg-(--paper) p-4 md:p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-(--blood)/30 bg-(--paper-2) p-6 text-(--blood)">
          <h1 className="text-xl font-semibold">Invalid date format</h1>
          <p className="mt-2 text-sm">Please use YYYY-MM-DD.</p>
        </div>
      </main>
    );
  }

  const data = await getData(selectedDate || undefined);
  const supplyMap = new Map(data.supplies.map((item) => [item.key, item.value]));
  const normalizedSupplies = SUPPLY_ORDER.map((key) => ({
    key,
    value: supplyMap.get(key) ?? 0,
  }));
  const totalSupplies = normalizedSupplies.reduce((sum, item) => sum + item.value, 0);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,var(--paper),var(--paper-2))] p-4 md:p-8">
      <section className="mx-auto max-w-4xl rounded-2xl border border-(--paper-3) bg-(--paper) p-5 md:p-7">
        <div className="flex flex-col gap-6">
          <header className="space-y-3">
            <h1 className="text-2xl font-bold text-(--saffron-deep) md:text-3xl">CJP Supplies Tracker</h1>
            <p className="text-sm leading-relaxed text-(--ink-2) md:text-base">
              This tracker supports the youth-led Cockroach Janta Party (CJP) protests, centered on demands for systemic
              education reforms and the resignation of Union Education Minister Dharmendra Pradhan following major
              examination irregularities, including the NEET paper leaks.
            </p>
            <p className="text-sm text-(--ink-3)">Use this page to see daily support and record what you have sent.</p>
          </header>

          <section className="rounded-xl border border-(--gold)/50 bg-(--paper-2) p-4">
            <h2 className="text-base font-semibold text-(--saffron-deep)">Why this tracker?</h2>
            <p className="mt-2 text-sm leading-relaxed text-(--ink-2)">
              People across India who cannot come to the protest site are showing support by sending supplies through
              services like Blinkit, Instamart, Zomato etc. This support is deeply appreciated. At the same time, if too
              many supplies arrive on one day and drop sharply after that, it creates problems. We need a steady flow of
              supplies over the long run so protest support remains reliable and perishable items like prepared food do not
              go to waste.
            </p>
          </section>

          <form action="/" method="get" className="rounded-xl border border-(--paper-3) bg-(--paper-2) p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-2">
                <label htmlFor="date" className="text-sm font-medium text-(--ink-2)">
                  Choose a date
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={selectedDate || todayISO}
                  max={todayISO}
                  className="w-full rounded-lg border border-(--paper-3) bg-(--paper) px-3 py-2 text-(--ink) outline-none ring-(--saffron-2) focus:ring md:min-w-64"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-(--saffron) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--saffron-deep)"
              >
                Show Supplies
              </button>
            </div>
          </form>

          <SuppliesSubmitForm />

          <section className="rounded-xl border border-(--paper-3) bg-(--paper-2) p-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold text-(--saffron-deep)">Supplies for {selectedDate || "latest available date"}</h2>
              <p className="text-sm text-(--ink-3)">Total units: {totalSupplies.toLocaleString()}</p>
            </div>

            <ul className="mt-4 divide-y divide-(--paper-3) rounded-lg border border-(--paper-3) bg-(--paper)">
              {normalizedSupplies.map((item) => (
                <li key={item.key} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-(--ink-2)">{SUPPLY_LABELS[item.key]}</span>
                  <span className="text-base font-semibold text-(--green-2)">{item.value.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-(--paper-3) bg-(--paper-2) p-4">
            <h2 className="text-base font-semibold text-(--saffron-deep)">What counts as 1 Unit?</h2>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-(--ink-2)">
              <li><strong>Water:</strong> 1 unit = enough safe drinking water for 1 average person for 5 hours (about 1-1.5 liters).</li>
              <li><strong>Food:</strong> 1 unit = 1 ready-to-eat packaged portion for 1 person with shelf life over 24 hours (for example: 1 biscuit packet, 1 packaged lassi, 1 packaged milk pack, or 1 chips packet).</li>
              <li><strong>Prepared Food:</strong> 1 unit = 1 ready-to-eat meal portion for 1 person with a shelf life of less than 24 hours (for example: 1 fresh meal box or 1 pizza).</li>
              <li><strong>Medical:</strong> 1 unit = 1 complete basic treatment use for 1 person (for example: 1 first-aid kit use, 1 ORS packet, or one full dressing set).</li>
              <li><strong>Other:</strong> 1 unit = 1 clearly countable essential item; if bulk, count how many individual people-use portions it can be split into.</li>
            </ul>
          </section>

        </div>
      </section>
    </main>
  );
}
