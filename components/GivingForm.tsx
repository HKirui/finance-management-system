"use client";

import { useActionState, useEffect, useState } from "react";
import { createTransaction } from "@/app/actions/transactions";

type Account = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
};

type Profile = {
  id: string;
  name: string;
  type: "PERSONAL" | "BUSINESS";
  accounts: Account[];
  categories: Category[];
};

type GivingFormProps = {
  profiles: Profile[];
};

const givingTypes = [
  "Tithe",
  "Offering",
  "Altar Sacrifice",
  "Prophet's Honor",
];

const initialState = {
  success: false,
  message: "",
};

const label = "mb-1 block text-xs font-medium text-slate-600 dark:text-neutral-400";
const field =
  "min-h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-400 dark:focus:ring-neutral-100/10 dark:disabled:bg-neutral-900/50 dark:disabled:text-neutral-600";

export default function GivingForm({
  profiles,
}: GivingFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [profileId, setProfileId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [givingType, setGivingType] = useState("Tithe");
  const [calculationMode, setCalculationMode] = useState<
    "PERCENTAGE" | "CUSTOM"
  >("PERCENTAGE");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [percentage, setPercentage] = useState("10");
  const [customAmount, setCustomAmount] = useState("");
  const [date, setDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [description, setDescription] = useState("");

  const [state, formAction, isPending] = useActionState(
    createTransaction,
    initialState
  );

  const selectedProfile = profiles.find(
    (profile) => profile.id === profileId
  );

  const selectedCategory = selectedProfile?.categories.find(
    (category) => category.name === givingType
  );

  const calculatedAmount =
    calculationMode === "PERCENTAGE"
      ? Number(receivedAmount) * (Number(percentage) / 100)
      : Number(customAmount);

  const validAmount =
    Number.isFinite(calculatedAmount) &&
    calculatedAmount > 0 &&
    calculatedAmount <= 9999999999999.99;

  const roundedAmount = validAmount
    ? calculatedAmount.toFixed(2)
    : "";

  const resetForm = () => {
    setProfileId("");
    setAccountId("");
    setGivingType("Tithe");
    setCalculationMode("PERCENTAGE");
    setReceivedAmount("");
    setPercentage("10");
    setCustomAmount("");
    setDescription("");
  };

  useEffect(() => {
    if (state.success && !isPending) {
      setIsOpen(false);
      resetForm();
    }
  }, [state.success, isPending]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-slate-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
      >
        <span aria-hidden className="text-base leading-none">+</span>
        Record giving
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-giving-title"
            className="flex max-h-[calc(100dvh-24px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 sm:max-h-[calc(100dvh-32px)] sm:rounded-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-2.5 dark:border-neutral-800">
              <div>
                <h2
                  id="record-giving-title"
                  className="font-[family-name:var(--font-fraunces)] text-base tracking-tight text-slate-900 dark:text-neutral-100"
                >
                  Record giving
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">
                  Record personal or business giving.
                </p>
              </div>

              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-neutral-900 dark:hover:text-neutral-200"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form action={formAction} className="flex min-h-0 flex-1 flex-col">
              <input type="hidden" name="type" value="EXPENSE" />

              <input
                type="hidden"
                name="categoryId"
                value={selectedCategory?.id ?? ""}
              />

              <input
                type="hidden"
                name="amount"
                value={roundedAmount}
              />

              <div className="grid min-h-0 grid-cols-1 gap-x-3 gap-y-2 overflow-y-auto px-4 py-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="give-profile" className={label}>
                    Financial profile
                  </label>

                  <select
                    id="give-profile"
                    name="profileId"
                    value={profileId}
                    onChange={(event) => {
                      setProfileId(event.target.value);
                      setAccountId("");
                    }}
                    className={field}
                    required
                  >
                    <option value="">Select profile</option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <span className={label}>Giving category</span>
                  <div
                    role="radiogroup"
                    aria-label="Giving category"
                    className="grid grid-cols-4 gap-1.5"
                  >
                    {givingTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={givingType === type}
                        onClick={() => setGivingType(type)}
                        className={`min-h-8 min-w-0 rounded-md border px-1 text-center text-[10px] font-medium transition-colors ${
                          givingType === type
                            ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-400/60 dark:bg-amber-400/10 dark:text-amber-200"
                            : "border-slate-300 text-slate-600 hover:border-slate-400 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-500"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {selectedProfile && !selectedCategory && (
                    <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                      This giving category is missing from the selected profile.
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <span className={label}>Calculation method</span>
                  <div
                    role="radiogroup"
                    aria-label="Calculation method"
                    className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-neutral-900"
                  >
                    {(
                      [
                        ["PERCENTAGE", "Percentage"],
                        ["CUSTOM", "Custom amount"],
                      ] as const
                    ).map(([mode, text]) => (
                      <button
                        key={mode}
                        type="button"
                        role="radio"
                        aria-checked={calculationMode === mode}
                        onClick={() => setCalculationMode(mode)}
                        className={`min-h-8 rounded-md text-[13px] font-medium transition-colors ${
                          calculationMode === mode
                            ? "bg-white text-slate-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100"
                            : "text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                        }`}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>

                {calculationMode === "PERCENTAGE" ? (
                  <>
                    <div>
                      <label htmlFor="give-received" className={label}>
                        Amount received
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate-400 dark:text-neutral-500">
                          KES
                        </span>
                        <input
                          id="give-received"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={receivedAmount}
                          onChange={(event) =>
                            setReceivedAmount(event.target.value)
                          }
                          placeholder="0.00"
                          className={`${field} pl-11 tabular-nums`}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="give-percentage" className={label}>
                        Percentage
                      </label>
                      <div className="relative">
                        <input
                          id="give-percentage"
                          type="number"
                          min="0.01"
                          max="100"
                          step="0.01"
                          value={percentage}
                          onChange={(event) =>
                            setPercentage(event.target.value)
                          }
                          className={`${field} pr-8 tabular-nums`}
                          required
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 dark:text-neutral-500">
                          %
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-2">
                    <label htmlFor="give-custom" className={label}>
                      Giving amount
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate-400 dark:text-neutral-500">
                        KES
                      </span>
                      <input
                        id="give-custom"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={customAmount}
                        onChange={(event) =>
                          setCustomAmount(event.target.value)
                        }
                        placeholder="0.00"
                        className={`${field} pl-11 tabular-nums`}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-lg border border-amber-300/70 bg-amber-50/70 px-3.5 py-2 dark:border-amber-400/20 dark:bg-amber-400/[0.05] sm:col-span-2">
                  <p className="text-xs text-amber-800 dark:text-amber-200/80">
                    Amount to record
                  </p>
                  <p className="font-[family-name:var(--font-fraunces)] text-lg tabular-nums text-slate-900 dark:text-neutral-100">
                    KES{" "}
                    {validAmount
                      ? calculatedAmount.toLocaleString("en-KE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "0.00"}
                  </p>
                </div>

                <div>
                  <label htmlFor="give-account" className={label}>
                    Account
                  </label>

                  <select
                    id="give-account"
                    name="accountId"
                    value={accountId}
                    onChange={(event) =>
                      setAccountId(event.target.value)
                    }
                    disabled={!selectedProfile}
                    className={field}
                    required
                  >
                    <option value="">Select account</option>
                    {selectedProfile?.accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="give-date" className={label}>
                    Date
                  </label>
                  <input
                    id="give-date"
                    type="date"
                    name="date"
                    value={date}
                    onChange={(event) =>
                      setDate(event.target.value)
                    }
                    className={`${field} dark:[color-scheme:dark]`}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="give-description" className={label}>
                    Description (optional)
                  </label>
                  <input
                    id="give-description"
                    type="text"
                    name="description"
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    placeholder="Add a note"
                    className={field}
                  />
                </div>

                {state.message && !state.success && (
                  <div
                    role="alert"
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 sm:col-span-2"
                  >
                    {state.message}
                  </div>
                )}

                <p className="pt-1 text-center font-[family-name:var(--font-fraunces)] text-xs italic text-amber-700 dark:text-amber-300/80 sm:col-span-2">
                  “For God loves a person who gives cheerfully.”
                  <span className="ml-1.5 text-[10px] not-italic tracking-wider text-slate-400 dark:text-neutral-500">
                    2 COR 9:7
                  </span>
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-2.5 dark:border-neutral-800">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsOpen(false)}
                  className="min-h-9 rounded-lg border border-slate-300 px-4 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isPending ||
                    !selectedCategory ||
                    !validAmount ||
                    !accountId
                  }
                  className="min-h-9 rounded-lg bg-slate-900 px-5 text-[13px] font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                >
                  {isPending ? "Saving..." : "Record giving"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}