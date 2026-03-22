import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-blue-600">Next.js + Supabase + 토스(테스트)</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          실제 구조에 가까운 쇼핑몰 데모
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          회원·DB·주문·결제 승인은 서버에서 처리합니다. 로컬에서는{" "}
          <code className="rounded bg-slate-100 px-1">.env.local</code> 설정이
          필요합니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/products"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
          >
            상품 보기
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-200 px-5 py-2.5 hover:bg-slate-50"
          >
            로그인
          </Link>
        </div>
      </div>
      <ul className="list-inside list-disc text-sm text-slate-600">
        <li>Supabase: Auth(세션 쿠키) + Postgres(RLS)</li>
        <li>장바구니: 로그인 사용자 기준 DB 저장</li>
        <li>결제: 토스페이먼츠 테스트 키 + 서버 승인 API</li>
      </ul>
    </div>
  );
}
