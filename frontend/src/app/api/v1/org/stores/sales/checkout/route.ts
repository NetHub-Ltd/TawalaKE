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

    if (!body) {
      return NextResponse.json({ error: "Invalid request, body is needed" }, { status: 400 });
    }

    // 1. FIXED: Added the body payload downstream to your backend service
    const res = await fetch(`${process.env.BACKEND_URL}/business/create-sale`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error("An error occurred during backend checkout endpoint invocation:", res.statusText);
      return NextResponse.json({ error: res.statusText }, { status: res.status });
    }


    const data = await res.json()
    console.debug("response data", data)

    if (!data.status) {
      return NextResponse.json({ error: data.message || "Checkout status verification rejected" }, { status: 400 });
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error("Fatal execution pipeline crash inside route handler:", error);
    
    // 3. FIXED: Guarantees Next.js always gets a Response object, even if things completely break
    return NextResponse.json(
      { error: error?.message || "Internal Server Pipeline Exception" },
      { status: 500 }
    );
  }
}