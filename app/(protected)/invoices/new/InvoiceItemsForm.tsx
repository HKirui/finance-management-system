"use client";

import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type InvoiceItem = {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
};

type InvoiceItemsFormProps = {
  initialItems?: {
    description: string;
    quantity: string;
    unitPrice: string;
  }[];
  initialTaxRate?: string;
};

const label = "mb-1 block text-[11px] font-medium text-slate-500 dark:text-neutral-400";
const field =
  "min-h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-400 dark:focus:ring-neutral-100/10";

const money = (value: number) =>
  value.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function InvoiceItemsForm({
  initialItems,
  initialTaxRate = "0",
}: InvoiceItemsFormProps) {
  const [items, setItems] = useState<InvoiceItem[]>(() =>
    initialItems && initialItems.length > 0
      ? initialItems.map((item, index) => ({
          id: index + 1,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      : [
          {
            id: 1,
            description: "",
            quantity: "1",
            unitPrice: "",
          },
        ]
  );

  const nextId = useRef(Math.max(2, (initialItems?.length ?? 0) + 1));

  const [taxRate, setTaxRate] = useState(initialTaxRate);

  // Update an invoice item
  function updateItem(
    id: number,
    field: "description" | "quantity" | "unitPrice",
    value: string
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  // Add another item
  function addItem() {
    setItems((current) => [
      ...current,
      {
        id: nextId.current++,
        description: "",
        quantity: "1",
        unitPrice: "",
      },
    ]);
  }

  // Remove an item
  function removeItem(id: number) {
    setItems((current) =>
      current.length > 1 ? current.filter((item) => item.id !== id) : current
    );
  }

  // Calculate invoice subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
    0
  );

  // Calculate tax
  const taxAmount = subtotal * (Number(taxRate) / 100);

  // Calculate final invoice total
  const total = subtotal + taxAmount;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-fraunces)] text-base">
          Invoice items
        </h2>

        <button
          type="button"
          onClick={addItem}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
        >
          <Plus size={14} />
          Add item
        </button>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => {
          const lineTotal = Number(item.quantity) * Number(item.unitPrice);

          return (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 p-3 dark:border-neutral-800"
            >
              <div className="grid gap-3 md:grid-cols-12">
                <div className="md:col-span-5">
                  <label className={label}>Service / product</label>

                  <input
                    name="itemDescription"
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) =>
                      updateItem(item.id, "description", e.target.value)
                    }
                    placeholder="Service description"
                    className={field}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={label}>Quantity</label>

                  <input
                    name="itemQuantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, "quantity", e.target.value)
                    }
                    className={`${field} tabular-nums`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={label}>Unit price</label>

                  <input
                    name="itemUnitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(item.id, "unitPrice", e.target.value)
                    }
                    placeholder="0.00"
                    className={`${field} tabular-nums`}
                  />
                </div>

                <div className="flex items-end justify-between gap-2 md:col-span-3">
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
                      Line total
                    </p>

                    <p className="mt-2 text-[13px] font-semibold tabular-nums">
                      KES {money(lineTotal)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="grid size-9 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 dark:text-neutral-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <Trash2 size={15} strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-slate-200 pt-4 dark:border-neutral-800">
        <div className="ml-auto max-w-xs space-y-3 text-[13px]">
          {/* Subtotal */}
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-neutral-400">Subtotal</span>
            <span className="font-medium tabular-nums">KES {money(subtotal)}</span>
          </div>

          {/* Tax Rate */}
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="taxRate"
              className="text-slate-500 dark:text-neutral-400"
            >
              Tax rate (%)
            </label>

            <input
              id="taxRate"
              name="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className={`${field} w-24 text-right tabular-nums`}
            />
          </div>

          {/* Tax Amount */}
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-neutral-400">Tax amount</span>
            <span className="font-medium tabular-nums">KES {money(taxAmount)}</span>
          </div>

          {/* Invoice Total */}
          <div className="flex items-baseline justify-between border-t border-slate-200 pt-3 dark:border-neutral-800">
            <span className="font-semibold">Invoice total</span>
            <span className="font-[family-name:var(--font-fraunces)] text-lg tabular-nums">
              KES {money(total)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}