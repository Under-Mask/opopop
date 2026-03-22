"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Inner() {
  const params = useSearchParams();
  const code = params.get("code");
  const message = params.get("message");

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
      <h1 className="text-xl font-bold text-red-800">결제 실패</h1>
      <p className="mt-2 text-sm text-red-800">
        {message || "결제가 취소되었거나 실패했습니다."}
      </p>
      {code && (
        <p className="mt-1 text-xs text-red-700">
          코드: {code}
        </p>
      )}
      <div className="mt-6">
        <Link href="/cart" className="font-medium text-blue-700 hover:underline">
          장바구니로 돌아가기
        </Link>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div>로딩…</div>}>
      <Inner />
    </Suspense>
  );
}
