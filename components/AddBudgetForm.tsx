"use client";

import { useActionState, useEffect, useState } from "react";
import { createBudget } from "@/app/actions/budgets";

type Category = {
  id: string;
  name: string;
};

type Profile = {
  id: string;
  name: string;
  categories: Category[];
};

type AddBudgetFormProps = {
  profiles: Profile[];
};

export default function AddBudgetForm({
  profiles,
}: AddBudgetFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [profileId, setProfileId] = useState("");

  const initialState = {
    success: false,
    message: "",
  };

  const [state, formAction, isPending] = useActionState(
    createBudget,
    initialState
  );

  useEffect(() => {
    if (state.success && !isPending) {
      setIsOpen(false);
      setProfileId("");
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
        className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
      >
        + Create Budget
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Create Budget
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Set a monthly spending limit.
            </p>
          </div>

          <button
            type="button"
            disabled={isPending}
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
              value={profileId}
              onChange={(event) => setProfileId(event.target.value)}
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
              Expense Category
            </label>

            <select
              name="categoryId"
              disabled={!selectedProfile}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 disabled:bg-gray-100"
              required
            >
              <option value="">Select category</option>

              {selectedProfile?.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Month
              </label>

              <select
                name="month"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                required
              >
                <option value="">Month</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Year
              </label>

              <input
                type="number"
                name="year"
                defaultValue={new Date().getFullYear()}
                min="2020"
                max="2100"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Budget Amount (KES)
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
              {isPending ? "Creating..." : "Create Budget"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}