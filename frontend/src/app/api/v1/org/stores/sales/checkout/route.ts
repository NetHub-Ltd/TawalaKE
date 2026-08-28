import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const token = session?.accessToken;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Request body:", JSON.stringify(body));

    if (!body) {
      return NextResponse.json(
        { error: "Invalid request, body is needed" },
        { status: 400 },
      );
    }

    const res = await fetch(`${process.env.BACKEND_URL}/business/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error(
        "Backend checkout failed:",
        res.status,
        JSON.stringify(data),
      );
      // Forward backend detail/message so cashiers see real errors
      const detail =
        (typeof data?.detail === "string" && data.detail) ||
        (typeof data?.message === "string" && data.message) ||
        (typeof data?.error === "string" && data.error) ||
        res.statusText ||
        "Checkout failed";
      return NextResponse.json(
        { error: detail, detail, message: detail },
        { status: res.status },
      );
    }

    console.debug("response data", data);

    // Backend returns a Sale object (has id). Accept that as success.
    // Also accept ApiResponse-shaped payloads if introduced later.
    if (
      data &&
      typeof data === "object" &&
      (typeof (data as { id?: string }).id === "string" ||
        (data as { status?: boolean }).status === true)
    ) {
      return NextResponse.json(data, { status: 200 });
    }

    // Unexpected shape but HTTP OK — still return body for debugging
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Fatal execution pipeline crash inside route handler:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Internal Server Pipeline Exception";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
