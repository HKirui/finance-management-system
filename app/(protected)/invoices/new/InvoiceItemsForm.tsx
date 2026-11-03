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

const nextId = useRef(
  Math.max(2, (initialItems?.length ?? 0) + 1)
);

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
      current.length > 1
        ? current.filter((item) => item.id !== id)
        : current
    );
  }

  // Calculate invoice subtotal
const subtotal = items.reduce(
  (sum, item) =>
    sum + Number(item.quantity) * Number(item.unitPrice),
  0
);

// Calculate tax
const taxAmount = subtotal * (Number(taxRate) / 100);

// Calculate final invoice total
const total = subtotal + taxAmount;

  return (
    <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#090909]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Invoice Items
        </h2>

        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const lineTotal =
            Number(item.quantity) * Number(item.unitPrice);

          return (
            <div
              key={item.id}
              className="rounded-lg border border-gray-200 p-3 dark:border-neutral-800"
            >
              <div className="grid gap-3 md:grid-cols-12">
                <div className="md:col-span-5">
                  <label className="mb-1 block text-xs text-gray-500 dark:text-neutral-400">
                    Service / Product
                  </label>

                  <input
                    name="itemDescription"
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) =>
                      updateItem(item.id, "description", e.target.value)
                    }
                    placeholder="Service description"
                    className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs text-gray-500 dark:text-neutral-400">
                    Quantity
                  </label>

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
                    className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs text-gray-500 dark:text-neutral-400">
                    Unit Price
                  </label>

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
                    className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
                  />
                </div>

                <div className="flex items-end justify-between gap-2 md:col-span-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-neutral-400">
                      Line Total
                    </p>

                    <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                      KES {lineTotal.toLocaleString("en-KE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 dark:text-red-400 dark:hover:bg-red-950"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

     <div className="mt-4 border-t border-gray-200 pt-4 dark:border-neutral-800">
  <div className="ml-auto max-w-sm space-y-4">

    {/* Subtotal */}
    <div className="flex justify-between text-sm">
      <span className="text-gray-500 dark:text-neutral-400">
        Subtotal
      </span>

      <span className="font-medium text-gray-900 dark:text-white">
        KES {subtotal.toLocaleString("en-KE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    </div>

    {/* Tax Rate */}
    <div className="flex items-center justify-between gap-4">
      <label
        htmlFor="taxRate"
        className="text-sm text-gray-500 dark:text-neutral-400"
      >
        Tax Rate (%)
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
        className="w-24 rounded-lg border border-gray-300 bg-white p-2 text-right text-sm text-gray-900 dark:border-neutral-700 dark:bg-[#111111] dark:text-white"
      />
    </div>

    {/* Tax Amount */}
    <div className="flex justify-between text-sm">
      <span className="text-gray-500 dark:text-neutral-400">
        Tax Amount
      </span>

      <span className="font-medium text-gray-900 dark:text-white">
        KES {taxAmount.toLocaleString("en-KE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    </div>

    {/* Invoice Total */}
    <div className="flex justify-between border-t border-gray-200 pt-4 dark:border-neutral-800">
      <span className="font-semibold text-gray-900 dark:text-white">
        Invoice Total
      </span>

      <span className="text-xl font-bold text-gray-900 dark:text-white">
        KES {total.toLocaleString("en-KE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    </div>

  </div>
</div>
    </section>
  );
}