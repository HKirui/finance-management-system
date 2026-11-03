
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
        className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
      >
        + Record Giving
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Record Giving
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Record personal or business giving.
                </p>
              </div>

              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                className="text-2xl text-gray-400 hover:text-gray-700"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form action={formAction} className="space-y-4">
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

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Financial Profile
                </label>

                <select
                  name="profileId"
                  value={profileId}
                  onChange={(event) => {
                    setProfileId(event.target.value);
                    setAccountId("");
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
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

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Giving Category
                </label>

                <select
                  value={givingType}
                  onChange={(event) =>
                    setGivingType(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                  required
                >
                  {givingTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                {selectedProfile && !selectedCategory && (
                  <p className="mt-1 text-sm text-red-600">
                    This giving category is missing from the selected profile.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Calculation Method
                </label>

                <div className="flex gap-5 text-sm text-gray-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={calculationMode === "PERCENTAGE"}
                      onChange={() =>
                        setCalculationMode("PERCENTAGE")
                      }
                    />
                    Percentage
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={calculationMode === "CUSTOM"}
                      onChange={() =>
                        setCalculationMode("CUSTOM")
                      }
                    />
                    Custom Amount
                  </label>
                </div>
              </div>

              {calculationMode === "PERCENTAGE" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Amount Received (KES)
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={receivedAmount}
                      onChange={(event) =>
                        setReceivedAmount(event.target.value)
                      }
                      placeholder="0.00"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Percentage (%)
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      value={percentage}
                      onChange={(event) =>
                        setPercentage(event.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Giving Amount (KES)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={customAmount}
                    onChange={(event) =>
                      setCustomAmount(event.target.value)
                    }
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                    required
                  />
                </div>
              )}

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Amount to Record
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
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
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Account
                </label>

                <select
                  name="accountId"
                  value={accountId}
                  onChange={(event) =>
                    setAccountId(event.target.value)
                  }
                  disabled={!selectedProfile}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 disabled:bg-gray-100"
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
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={date}
                  onChange={(event) =>
                    setDate(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  name="description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Add a note"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                />
              </div>

              {state.message && !state.success && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {state.message}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 disabled:opacity-50"
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
                  className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Record Giving"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
