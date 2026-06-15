// this route proxies a POST request to the backend
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.BACKEND_URL;

export async function POST(req: NextRequest) {
    const session = await auth()

    if(!session?.accessToken){
        return NextResponse.json({error: "Unauthorized!"}, {status: 401})
    }

    const body = await req.json()
    if(!body){
        // return a 400
        return NextResponse.json({"error": "Invalid request body"}, {status: 400})
    }
    console.log("request data", body)

    const res = await fetch(`${API_BASE}/business/stock-audit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
    if (!data.status) {
      return NextResponse.json({ error: data.message }, { status: res.status });
    }
    return NextResponse.json(data, { status: res.status });
}