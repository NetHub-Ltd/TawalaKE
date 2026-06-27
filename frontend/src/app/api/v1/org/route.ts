import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";


export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // grab the organization_id from the params
    const { searchParams } = new URL(request.url);
    const organization_id = searchParams.get("organization_id");
    if (!organization_id) {
        return NextResponse.json({ error: "Organization ID not provided" }, { status: 400 });
    }

    const res = await fetch(`${process.env.BACKEND_URL}/organizations/${organization_id}`, {
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