import Link from "next/link";
import { getCurrentUserRole } from "@/lib/auth";

export async function Header() {
  const session = await getCurrentUserRole();

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-slate-900">
          Shop Real
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
          <Link href="/products" className="hover:text-blue-600">
            상품
          </Link>
          <Link href="/cart" className="hover:text-blue-600">
            장바구니
          </Link>
          {session ? (
            <>
              <span className="hidden text-slate-500 sm:inline">
                {session.email}
              </span>
              {session.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-900 hover:bg-amber-100"
                >
                  관리자
                </Link>
              )}
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
