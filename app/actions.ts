"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { signSession } from "@/lib/auth";
import { toKobo } from "@/lib/money";

export async function login(formData: FormData) {
  const passcode = formData.get("passcode");
  const expectedPasscode = process.env.SHOP_PASSCODE || "1234";

  if (passcode !== expectedPasscode) {
    redirect("/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set("session", await signSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}

export async function addSale(formData: FormData) {
  const name = String(formData.get("item_name") ?? "").trim();
  const unitKobo = toKobo(String(formData.get("amount") ?? ""));
  const rawQuantity = parseInt(String(formData.get("quantity") ?? "1"), 10);
  const quantity = Number.isFinite(rawQuantity) && rawQuantity > 0 ? rawQuantity : 1;
  const when = String(formData.get("sold_at") ?? "").trim();

  if (!name) {
    return { error: "Item name is required." };
  }
  if (!Number.isFinite(unitKobo) || unitKobo <= 0) {
    return { error: "Unit amount must be greater than ₦0." };
  }

  // Multiply unit amount by quantity to log total
  const totalKobo = unitKobo * quantity;

  // Lagos is UTC+1 all year (no daylight saving), so append the offset.
  const soldAt = when ? `${when}:00+01:00` : new Date().toISOString();

  // Transparent display name with multiplier if qty > 1
  const displayName = quantity > 1 ? `${name} (×${quantity})` : name;

  try {
    // Attempt insert with quantity column
    await sql`
      insert into sales (item_name, amount_kobo, quantity, sold_at)
      values (${displayName}, ${totalKobo}, ${quantity}, ${soldAt})
    `;
    revalidatePath("/");
    return { success: true };
  } catch {
    // Fallback if quantity column does not exist yet on existing table
    try {
      await sql`
        insert into sales (item_name, amount_kobo, sold_at)
        values (${displayName}, ${totalKobo}, ${soldAt})
      `;
      revalidatePath("/");
      return { success: true };
    } catch (fallbackErr: unknown) {
      const errorMsg =
        fallbackErr instanceof Error ? fallbackErr.message : "Failed to record sale";
      console.error("Error inserting sale:", errorMsg);
      return { error: errorMsg };
    }
  }
}
