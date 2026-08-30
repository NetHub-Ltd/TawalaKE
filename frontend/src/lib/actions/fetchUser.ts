"use server";

import { auth } from "@/auth";
import { getServerAccessToken } from "@/lib/auth/get-server-access-token";

export async function fetchUser() {
  const session = await auth();
  const accessToken =
    (await getServerAccessToken()) ?? session?.accessToken ?? null;
  const baseUrl = process.env.BACKEND_URL;

  if (!accessToken || session?.error) {
    throw new Error("Unauthorized: No token provided");
  }
  try {
    const res = await fetch(`${baseUrl}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`upstream_error: ${res.status}`);
    }

    const json = await res.json();
    return json;
  } catch (error) {
    console.error("Internal Server Fetch Error:", error);
    throw new Error("failed_to_retrieve_user");
  }
}
