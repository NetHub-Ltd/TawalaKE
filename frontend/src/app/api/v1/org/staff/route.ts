import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";

// fetch staff using organization id
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // grab the organization_id from the params
    const { searchParams } = new URL(request.url);
    const organization_id = searchParams.get("organizationId");
    if (!organization_id) {
        return NextResponse.json({ error: "Organization ID not provided" }, { status: 400 });
    }

    const res = await fetch(`${process.env.BACKEND_URL}/organizations/staff/${organization_id}`, {
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

// register new staff
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // grab the body from the request
    const body = await request.json();

    console.log(body)
    // proxy the request to the backend
    const res = await fetch(`${process.env.BACKEND_URL}/business/assign-staff`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        console.error(res.statusText)
        return NextResponse.json({ error: res.statusText}, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
}