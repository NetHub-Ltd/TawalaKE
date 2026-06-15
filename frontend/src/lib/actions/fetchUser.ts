"use server";

import { zUserRead } from "../types/zod.gen";
import { auth } from "@/auth";

export async function fetchUser() {
  const session = await auth();
  const baseUrl = process.env.BACKEND_URL;

  if (!session?.accessToken) {
    throw new Error("Unauthorized: No token provided");
  }
  try {
    const res = await fetch(`${baseUrl}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      // Ensures the server fetches fresh data
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`upstream_error: ${res.status}`);
    }

    const json = await res.json();
    // const parsed = zUserRead.safeParse(json);

    // if (!parsed.success) {
    //   throw new Error("data_integrity_error");
    // }
    console.log("user data", json)
    return json;
  } catch (error) {
    console.error("Internal Server Fetch Error:", error);
    throw new Error("failed_to_retrieve_user");
  }
}
