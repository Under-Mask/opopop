import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CartTable } from "./ui";

function formatPrice(n: number) {
  return `₩${n.toLocaleString("ko-KR")}`;
}

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rows, error } = await supabase
    .from("cart_items")
    .select("id, quantity, products(id, name, price)")
    .eq("user_id", user.id);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
        장바구니 조회 실패: {error.message}
      </div>
    );
  }

  type Row = {
    id: string;
    quantity: number;
    products: {
      id: string;
      name: string;
      price: number;
    } | null;
  };

  const items = (rows || []) as unknown as Row[];

  const lines = items
    .filter((r) => r.products)
    .map((r) => ({
      cartId: r.id,
      name: r.products!.name,
      unitPrice: r.products!.price,
      qty: r.quantity,
      subtotal: r.products!.price * r.quantity,
    }));

  const total = lines.reduce((s, l) => s + l.subtotal, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">장바구니</h1>
      <p className="mt-1 text-sm text-slate-600">
        로그인 사용자 기준으로 DB에 저장됩니다.
      </p>

      {lines.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          장바구니가 비어 있습니다.
          <div className="mt-4">
            <Link href="/products" className="text-blue-600 hover:underline">
              상품 보러가기
            </Link>
          </div>
        </div>
      ) : (
        <>
          <CartTable lines={lines} />
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-lg font-bold">합계 {formatPrice(total)}</p>
            <Link
              href="/checkout"
              className="rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              주문하기
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
