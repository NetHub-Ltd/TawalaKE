import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";

export async function GET() {
    const session = await auth();
    const organizationId = session?.user.organization_id
    if (!session?.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    if(!organizationId){
        return NextResponse.json({error: "Organization Id is required", status: 400})
    }


    const res = await fetch(`${process.env.BACKEND_URL}/organizations/stores/${organizationId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
        },
    });

    if (!res.ok) {
        return NextResponse.json({ error: res.statusText}, { status: res.status });
    }
    const data = await res.json();
    if (!data.status) {
        return NextResponse.json({ error: data.message }, { status: res.status });
    }

    return NextResponse.json(data.data, { status: 200 });
}


export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = session.user?.organization_id;

  if (!organizationId) {
    return NextResponse.json(
      { error: "Organization Id is required" },
      { status: 400 },
    );
  }

  let reqData: unknown;
  try {
    reqData = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid or empty JSON body" },
      { status: 400 },
    );
  }

  console.debug("Store Creation Data", reqData);

  const res = await fetch(`${process.env.BACKEND_URL}/organizations/new-store`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(reqData),
  });

  // Read the body only once
  const responseBody = await res.json().catch(() => null);

  if (!res.ok) {
    console.error("Backend error", res.status, res.statusText, responseBody);
    const detail = responseBody?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : detail?.message || responseBody?.error || responseBody?.message || res.statusText;
    return NextResponse.json(
      {
        error: message,
        detail,
        code: typeof detail === "object" ? detail?.code : undefined,
      },
      { status: res.status },
    );
  }

  // Prefer the nested data if the backend wraps it, otherwise return the whole body
  const data = responseBody?.data;

  return NextResponse.json(data, { status: 200 });
}