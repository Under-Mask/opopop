"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Line = {
  cartId: string;
  name: string;
  unitPrice: number;
  qty: number;
  subtotal: number;
};

function formatPrice(n: number) {
  return `₩${n.toLocaleString("ko-KR")}`;
}

export function CartTable({ lines }: { lines: Line[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const supabase = createClient();

  async function remove(cartId: string) {
    setPending(cartId);
    await supabase.from("cart_items").delete().eq("id", cartId);
    setPending(null);
    router.refresh();
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="px-4 py-3">상품</th>
            <th className="px-4 py-3">가격</th>
            <th className="px-4 py-3">수량</th>
            <th className="px-4 py-3">소계</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.cartId} className="border-t border-slate-100">
              <td className="px-4 py-3 font-medium">{l.name}</td>
              <td className="px-4 py-3">{formatPrice(l.unitPrice)}</td>
              <td className="px-4 py-3">{l.qty}</td>
              <td className="px-4 py-3">{formatPrice(l.subtotal)}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => remove(l.cartId)}
                  disabled={pending === l.cartId}
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
