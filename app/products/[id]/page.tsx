import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { AddToCartForm } from "./ui";

function formatPrice(n: number) {
  return `₩${n.toLocaleString("ko-KR")}`;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const product = data as Product;

  return (
    <div>
      <Link href="/products" className="text-sm text-blue-600 hover:underline">
        ← 상품 목록
      </Link>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50 text-slate-500">
          이미지 영역
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
          <p className="mt-3 text-slate-600">{product.description}</p>
          <p className="mt-6 text-2xl font-bold">{formatPrice(product.price)}</p>
          <p className="mt-2 text-sm text-slate-600">
            재고 {product.stock ?? 0}개
            {(product.stock ?? 0) === 0 && (
              <span className="ml-2 font-medium text-red-600">품절</span>
            )}
          </p>
          <AddToCartForm
            productId={product.id}
            stock={product.stock ?? 0}
          />
        </div>
      </div>
    </div>
  );
}
