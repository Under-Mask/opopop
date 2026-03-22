"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const [msg, setMsg] = useState("결제 승인 처리 중…");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const paymentKey = params.get("paymentKey");
    const orderId = params.get("orderId");
    const amount = params.get("amount");
    if (!paymentKey || !orderId || !amount) {
      setMsg("결제 파라미터가 없습니다. 다시 시도해 주세요.");
      return;
    }

    let cancelled = false;
    (async () => {
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: Number(amount),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (cancelled) return;
      if (!res.ok) {
        setMsg(data.error || "승인 실패");
        return;
      }
      setOk(true);
      setMsg("결제가 완료되었습니다.");
      router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [params, router]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">결제 결과</h1>
      <p className="mt-2 text-slate-700">{msg}</p>
      {ok && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/products"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
          >
            쇼핑 계속
          </Link>
          <Link href="/" className="rounded-xl border border-slate-200 px-5 py-2.5 hover:bg-slate-50">
            홈
          </Link>
        </div>
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="text-slate-600">로딩…</div>}>
      <Inner />
    </Suspense>
  );
}
