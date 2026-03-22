"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/types";

function formatPrice(n: number) {
  return `₩${n.toLocaleString("ko-KR")}`;
}

export function AdminProductTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(
    id: string,
    values: { name: string; price: number; stock: number }
  ) {
    setPending(id);
    setMsg(null);
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        price: values.price,
        stock: values.stock,
      }),
    });
    const data = (await res.json()) as { error?: string };
    setPending(null);
    if (!res.ok) {
      setMsg(data.error || "저장 실패");
      return;
    }
    setMsg("저장했습니다.");
    router.refresh();
  }

  return (
    <div>
      {msg && (
        <p className="mb-4 text-sm text-slate-700" role="status">
          {msg}
        </p>
      )}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-3">상품명</th>
              <th className="px-3 py-3">가격</th>
              <th className="px-3 py-3">재고</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <AdminProductRow
                key={p.id}
                product={p}
                disabled={pending === p.id}
                onSave={save}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminProductRow({
  product,
  disabled,
  onSave,
}: {
  product: Product;
  disabled: boolean;
  onSave: (
    id: string,
    values: { name: string; price: number; stock: number }
  ) => void;
}) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock ?? 0));

  return (
    <tr className="border-t border-slate-100">
      <td className="px-3 py-2 align-top">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full min-w-[140px] rounded-lg border border-slate-200 px-2 py-1.5"
        />
      </td>
      <td className="px-3 py-2 align-top">
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-28 rounded-lg border border-slate-200 px-2 py-1.5"
        />
        <span className="ml-1 text-xs text-slate-500">
          {formatPrice(Number(price) || 0)}
        </span>
      </td>
      <td className="px-3 py-2 align-top">
        <input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="w-24 rounded-lg border border-slate-200 px-2 py-1.5"
        />
      </td>
      <td className="px-3 py-2 align-top">
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onSave(product.id, {
              name,
              price: Math.round(Number(price) || 0),
              stock: Math.round(Number(stock) || 0),
            })
          }
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {disabled ? "저장 중…" : "저장"}
        </button>
      </td>
    </tr>
  );
}
