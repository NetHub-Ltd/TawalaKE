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


export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Safely handle the body. If frontend sends a string, parse it.
        const rawBody = await request.text();
        let parsedBody;
        
        try {
            parsedBody = JSON.parse(rawBody);
        } catch {
            // Fallback if it was already a clean JS object stream
            parsedBody = JSON.parse(JSON.stringify(rawBody));
        }

        // 2. Proxy the request to the backend
        const res = await fetch(`${process.env.BACKEND_URL}/business/assign-staff`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify(parsedBody), // Single guaranteed serialization
        });

        // 3. Catch errors and forward the ACTUAL backend error payload
        if (!res.ok) {
            const errorData = await res.json().catch(() => null);
            // console.error("Backend Error Response:", errorData || res.statusText);
            console.error("Backend Error Response:", JSON.stringify(errorData, null, 2));
            
            return NextResponse.json(
                errorData || { error: res.statusText }, 
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data, { status: res.status }); // Match backend status (200/201)

    } catch (err: any) {
        console.error("Proxy route crashed:", err);
        return NextResponse.json({ error: "Internal Proxy Error" }, { status: 500 });
    }
}
// // register new staff
// export async function POST(request: NextRequest) {
//     const session = await auth();
//     if (!session?.accessToken) {
//         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // grab the body from the request
//     const body = await request.json();


//     // proxy the request to the backend
//     const res = await fetch(`${process.env.BACKEND_URL}/business/assign-staff`, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${session.accessToken}`,
//         },
//         body: JSON.stringify(body),
//     });
//     if (!res.ok) {
//         console.error(res.statusText)
//         return NextResponse.json({ error: res.statusText}, { status: res.status });
//     }
//     const data = await res.json();
//     return NextResponse.json(data, { status: 201 });
// }

