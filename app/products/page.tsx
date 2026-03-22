import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

function formatPrice(n: number) {
  return `₩${n.toLocaleString("ko-KR")}`;
}

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
        상품을 불러오지 못했습니다. Supabase 테이블·환경변수를 확인하세요. (
        {error.message})
      </div>
    );
  }

  const list = (products || []) as Product[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">전체 상품</h1>
      <p className="mt-1 text-sm text-slate-600">
        데이터는 Supabase <code className="rounded bg-slate-100 px-1">products</code>{" "}
        테이블에서 조회합니다.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300"
          >
            <div className="flex h-36 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50 text-sm font-semibold text-slate-500">
              {p.name}
            </div>
            <h2 className="mt-3 font-semibold text-slate-900">{p.name}</h2>
            <p className="line-clamp-2 text-sm text-slate-600">{p.description}</p>
            <p className="mt-2 font-bold text-slate-900">{formatPrice(p.price)}</p>
            <p className="mt-1 text-xs text-slate-500">
              재고 {p.stock ?? 0}개
            </p>
          </Link>
        ))}
      </div>
      {list.length === 0 && (
        <p className="mt-8 text-slate-500">
          상품이 없습니다. <code>supabase/schema.sql</code> 실행 후 시드 데이터를
          넣었는지 확인하세요.
        </p>
      )}
    </div>
  );
}
