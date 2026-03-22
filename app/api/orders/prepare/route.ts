import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ProductSnippet = { id: string; name: string; price: number };

type CartLine = {
  quantity: number;
  product: ProductSnippet;
};

/** Supabase가 FK를 객체 또는 배열로 타입 추론할 수 있어 런타임에서만 맞춤 */
function parseCartLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const out: CartLine[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const quantity = Number((row as { quantity?: unknown }).quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;

    const rel = (row as { products?: unknown }).products;
    let product: ProductSnippet | null = null;
    if (Array.isArray(rel) && rel[0] && typeof rel[0] === "object") {
      const p = rel[0] as ProductSnippet;
      if (p.id && typeof p.price === "number") product = p;
    } else if (rel && typeof rel === "object" && "id" in rel) {
      const p = rel as ProductSnippet;
      if (p.id && typeof p.price === "number") product = p;
    }
    if (product) out.push({ quantity, product });
  }
  return out;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const recipient_name = String(body.recipient_name || "").trim();
  const address_line = String(body.address_line || "").trim();
  const phone = String(body.phone || "").trim();

  if (!recipient_name || !address_line || !phone) {
    return NextResponse.json(
      { error: "받는 분, 주소, 연락처를 입력하세요." },
      { status: 400 }
    );
  }

  const { data: cartRows, error: cartError } = await supabase
    .from("cart_items")
    .select("quantity, products(id, name, price)")
    .eq("user_id", user.id);

  if (cartError) {
    return NextResponse.json({ error: cartError.message }, { status: 500 });
  }

  const lines = parseCartLines(cartRows);
  if (lines.length === 0) {
    return NextResponse.json(
      { error: "장바구니가 비어 있습니다." },
      { status: 400 }
    );
  }

  const { data: stockRows, error: stockErr } = await supabase
    .from("products")
    .select("id, stock")
    .in(
      "id",
      lines.map((r) => r.product.id)
    );

  if (stockErr) {
    return NextResponse.json({ error: stockErr.message }, { status: 500 });
  }

  const stockMap = new Map(
    (stockRows || []).map((s: { id: string; stock: number }) => [s.id, s.stock])
  );

  for (const r of lines) {
    const pid = r.product.id;
    const available = stockMap.get(pid);
    if (available === undefined) {
      return NextResponse.json(
        { error: "상품 정보를 확인할 수 없습니다." },
        { status: 400 }
      );
    }
    if (r.quantity > available) {
      return NextResponse.json(
        {
          error: `재고가 부족합니다: ${r.product.name} (남은 수량 ${available}개)`,
        },
        { status: 400 }
      );
    }
  }

  let total = 0;
  for (const r of lines) {
    total += r.product.price * r.quantity;
  }

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      total_amount: total,
      status: "pending",
      recipient_name,
      address_line,
      phone,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return NextResponse.json(
      { error: orderErr?.message || "주문 생성 실패" },
      { status: 500 }
    );
  }

  const orderId = order.id as string;

  const itemPayload = lines.map((r) => ({
    order_id: orderId,
    product_id: r.product.id,
    quantity: r.quantity,
    unit_price: r.product.price,
  }));

  const { error: itemsErr } = await supabase.from("order_items").insert(itemPayload);

  if (itemsErr) {
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  return NextResponse.json({
    orderId,
    amount: total,
    orderName: "Shop Real 주문",
  });
}
