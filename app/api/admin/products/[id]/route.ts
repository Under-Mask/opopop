import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (prof?.role !== "admin") {
    return NextResponse.json({ error: "관리자만 수정할 수 있습니다." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const price = body.price !== undefined ? Number(body.price) : undefined;
  const stock = body.stock !== undefined ? Number(body.stock) : undefined;

  if (name !== undefined && !name) {
    return NextResponse.json({ error: "상품명이 비어 있습니다." }, { status: 400 });
  }
  if (price !== undefined && (!Number.isFinite(price) || price < 0)) {
    return NextResponse.json({ error: "가격이 올바르지 않습니다." }, { status: 400 });
  }
  if (stock !== undefined && (!Number.isFinite(stock) || stock < 0)) {
    return NextResponse.json({ error: "재고 수량이 올바르지 않습니다." }, { status: 400 });
  }

  const payload: Record<string, string | number> = {};
  if (name !== undefined) payload.name = name;
  if (price !== undefined) payload.price = Math.round(price);
  if (stock !== undefined) payload.stock = Math.round(stock);

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "변경할 항목이 없습니다." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "서버 설정(SUPABASE_SERVICE_ROLE_KEY)을 확인하세요." },
      { status: 500 }
    );
  }

  const { data, error } = await admin
    .from("products")
    .update(payload)
    .eq("id", id)
    .select("id, name, price, stock")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ product: data });
}
