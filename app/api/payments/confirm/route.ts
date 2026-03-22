import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const paymentKey = String(body.paymentKey || "");
  const orderId = String(body.orderId || "");
  const amount = Number(body.amount);

  if (!paymentKey || !orderId || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "서버에 TOSS_SECRET_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." },
      { status: 500 }
    );
  }

  const { data: order, error: orderFetchErr } = await admin
    .from("orders")
    .select("id, user_id, total_amount, status")
    .eq("id", orderId)
    .maybeSingle();

  if (orderFetchErr || !order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  if (order.status === "paid") {
    return NextResponse.json({ ok: true });
  }

  if (order.status !== "pending") {
    return NextResponse.json({ error: "처리할 수 없는 주문 상태입니다." }, { status: 400 });
  }

  if (order.total_amount !== amount) {
    return NextResponse.json({ error: "결제 금액이 주문과 일치하지 않습니다." }, { status: 400 });
  }

  const encoded = Buffer.from(`${secretKey}:`).toString("base64");

  const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const tossData = (await tossRes.json()) as { message?: string; status?: string };

  if (!tossRes.ok) {
    return NextResponse.json(
      { error: tossData.message || "토스 승인 실패" },
      { status: 400 }
    );
  }

  const { error: rpcErr } = await admin.rpc("complete_order_after_payment", {
    p_order_id: orderId,
    p_payment_key: paymentKey,
  });

  if (rpcErr) {
    return NextResponse.json(
      { error: rpcErr.message || "주문·재고 처리 실패 (관리자에게 문의하세요)" },
      { status: 500 }
    );
  }

  await admin.from("cart_items").delete().eq("user_id", order.user_id);

  return NextResponse.json({ ok: true });
}
