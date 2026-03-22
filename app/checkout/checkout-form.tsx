"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

export function CheckoutForm() {
  const [recipient, setRecipient] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";

  async function onPay(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const prep = await fetch("/api/orders/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient_name: recipient,
        address_line: address,
        phone,
      }),
    });
    const prepJson = (await prep.json()) as {
      error?: string;
      orderId?: string;
      amount?: number;
      orderName?: string;
    };

    if (!prep.ok) {
      setMsg(prepJson.error || "주문 준비 실패");
      setLoading(false);
      return;
    }

    if (!clientKey) {
      setMsg(
        ".env.local 에 NEXT_PUBLIC_TOSS_CLIENT_KEY (테스트 클라이언트 키)를 넣어 주세요."
      );
      setLoading(false);
      return;
    }

    try {
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: user.id });
      await payment.requestPayment({
        method: "CARD",
        amount: {
          currency: "KRW",
          value: prepJson.amount ?? 0,
        },
        orderId: prepJson.orderId!,
        orderName: prepJson.orderName || "Shop Real 주문",
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : "결제창 오류";
      setMsg(m);
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">주문 / 결제</h1>
      <p className="mt-1 text-sm text-slate-600">
        주문이 생성된 뒤 토스 결제창으로 이동합니다. 테스트 키를 사용하세요.
      </p>

      <form onSubmit={onPay} className="mt-6 max-w-lg space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">받는 분</label>
          <input
            required
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">주소</label>
          <textarea
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">연락처</label>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </div>
        {msg && (
          <p className="text-sm text-red-600" role="alert">
            {msg}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "처리 중…" : "토스로 결제하기"}
        </button>
      </form>
    </div>
  );
}
