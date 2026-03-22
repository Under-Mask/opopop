import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserRole } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUserRole();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <h1 className="text-lg font-bold text-slate-900">관리자</h1>
        <nav className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin" className="text-blue-600 hover:underline">
            대시보드
          </Link>
          <Link href="/admin/products" className="text-blue-600 hover:underline">
            상품·재고
          </Link>
          <Link href="/products" className="text-slate-600 hover:text-slate-900">
            쇼핑몰
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
