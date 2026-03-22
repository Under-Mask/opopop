"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AddToCartForm({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMsg("로그인이 필요합니다.");
      setLoading(false);
      router.push("/login");
      return;
    }

    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle();

    const nextQty = (existing?.quantity ?? 0) + qty;
    if (stock <= 0) {
      setMsg("품절입니다.");
      setLoading(false);
      return;
    }
    if (nextQty > stock) {
      setMsg(`재고는 ${stock}개까지 주문할 수 있습니다.`);
      setLoading(false);
      return;
    }

    const { error } = existing
      ? await supabase
          .from("cart_items")
          .update({ quantity: nextQty })
          .eq("id", existing.id)
      : await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: productId,
          quantity: qty,
        });

    if (error) {
      setMsg(error.message);
    } else {
      setMsg("장바구니에 담았습니다.");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <div className="flex items-center gap-3">
        <label htmlFor="qty" className="text-sm font-medium text-slate-700">
          수량
        </label>
        <input
          id="qty"
          type="number"
          min={stock > 0 ? 1 : 0}
          max={stock > 0 ? stock : 0}
          disabled={stock <= 0}
          value={qty}
          onChange={(e) => {
            const n = Number(e.target.value) || 1;
            if (stock <= 0) return;
            setQty(Math.min(Math.max(1, n), stock));
          }}
          className="w-24 rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        disabled={loading || stock <= 0}
        className="rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "처리 중…" : stock <= 0 ? "품절" : "장바구니 담기"}
      </button>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </form>
  );
}
