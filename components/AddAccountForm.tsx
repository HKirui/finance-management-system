"use client";

import { useActionState, useEffect, useState } from "react";
import { createAccount } from "@/app/actions/accounts";

type Profile = {
  id: string;
  name: string;
};

type AddAccountFormProps = {
  profiles: Profile[];
};

export default function AddAccountForm({
  profiles,
}: AddAccountFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const initialState = {
  success: false,
  message: "",
};

const [state, formAction, isPending] = useActionState(
  createAccount,
  initialState
);

useEffect(() => {
  if (state.success && !isPending) {
    setIsOpen(false);
  }
}, [state, isPending]);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
      >
        + Add Account
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Add Account
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Add a personal or K-Link financial account.
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
              name="profileId"
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
              Account Name
            </label>

            <input
              type="text"
              name="name"
              placeholder="e.g. KCB Personal"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Account Type
            </label>

            <select
              name="type"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
              required
            >
              <option value="">Select type</option>
              <option value="MPESA">M-Pesa</option>
              <option value="BANK">Bank</option>
              <option value="CASH">Cash</option>
              <option value="SAVINGS">Savings</option>
              <option value="INVESTMENT">Investment</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Opening Balance (KES)
            </label>

            <input
              type="number"
              name="openingBalance"
              min="0"
              step="0.01"
              defaultValue="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
              required
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
            disabled={isPending}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
             >
              {isPending ? "Creating..." : "Create Account"}
           </button>
          </div>
        </form>
      </div>
    </div>
  );
}