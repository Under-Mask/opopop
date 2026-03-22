import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div>
      <p className="text-slate-600">
        상품 가격·재고를 수정하려면 아래로 이동하세요.
      </p>
      <Link
        href="/admin/products"
        className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
      >
        상품·재고 관리
      </Link>
    </div>
  );
}
