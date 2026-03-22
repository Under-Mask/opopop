import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-xl font-bold">페이지를 찾을 수 없습니다</h1>
      <Link href="/products" className="mt-4 inline-block text-blue-600 hover:underline">
        상품 목록으로
      </Link>
    </div>
  );
}
