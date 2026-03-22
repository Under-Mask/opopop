import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { AdminProductTable } from "@/components/admin/AdminProductTable";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("name");

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
        상품을 불러오지 못했습니다: {error.message}
      </div>
    );
  }

  const list = (products || []) as Product[];

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">상품·재고</h2>
      <p className="mt-1 text-sm text-slate-600">
        가격과 재고를 바꾼 뒤 각 행의 저장을 누르세요.
      </p>
      <div className="mt-6">
        {list.length === 0 ? (
          <p className="text-slate-500">등록된 상품이 없습니다.</p>
        ) : (
          <AdminProductTable products={list} />
        )}
      </div>
    </div>
  );
}
