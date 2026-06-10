import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";

// fetch staff using organization id
export async function GET(request: NextRequest) {
    const session = await auth();
    const organizationId = session?.user.tenant_id
    if (!session?.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
