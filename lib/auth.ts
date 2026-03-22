import { createClient } from "@/lib/supabase/server";

export type UserRole = "user" | "admin";

export async function getCurrentUserRole(): Promise<{
  userId: string;
  email: string | undefined;
  role: UserRole;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (data?.role as UserRole | undefined) ?? "user";
  return { userId: user.id, email: user.email, role };
}
