"use client";

import { useActionState, useEffect, useState } from "react";
import { createTransfer } from "@/app/actions/transfers";

type Account = {
  id: string;
  name: string;
};

type Profile = {
  id: string;
  name: string;
  accounts: Account[];
};

type TransferFormProps = {
  profiles: Profile[];
};

export default function TransferForm({
  profiles,
}: TransferFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [profileId, setProfileId] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");

  const initialState = {
    success: false,
    message: "",
  };

  const [state, formAction, isPending] = useActionState(
    createTransfer,
    initialState
  );

  useEffect(() => {
    if (state.success && !isPending) {
      setIsOpen(false);
      setProfileId("");
      setFromAccountId("");
      setToAccountId("");
    }
  }, [state, isPending]);

  const selectedProfile = profiles.find(
    (profile) => profile.id === profileId
  );

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Transfer Money
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Transfer Money
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Move money between accounts in the same financial profile.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-2xl text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Financial Profile
            </label>

            <select
              value={profileId}
              onChange={(event) => {setProfileId(event.target.value); setFromAccountId(""); setToAccountId("");}}
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
              From Account
            </label>

            <select
              name="fromAccountId"
              value={fromAccountId}
              onChange={(event) => setFromAccountId(event.target.value)}
              disabled={!selectedProfile}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 disabled:bg-gray-100"
              required
            >
              <option value="">Select source account</option>

              {selectedProfile?.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              To Account
            </label>

            <select
              name="toAccountId"
              value={toAccountId}
              onChange={(event) => setToAccountId(event.target.value)}
              disabled={!selectedProfile}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 disabled:bg-gray-100"
              required
            >
              <option value="">Select destination account</option>

              {selectedProfile?.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Amount (KES)
            </label>

            <input
              type="number"
              name="amount"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Date
            </label>

            <input
              type="date"
              name="date"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Description
            </label>

            <input
              type="text"
              name="description"
              placeholder="e.g. M-Pesa to bank"
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
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700"
            >
              Cancel
            </button>

           <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
            {isPending ? "Transferring..." : "Transfer"}
          </button>
          </div>
        </form>
      </div>
    </div>
  );
}