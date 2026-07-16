import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";


export async function GET(req: NextRequest){
    
const session = await auth()

if(!session?.accessToken){
    return NextResponse.json({error: "Authorized"}, {status: 410})
}

// grab businessId from params
   // get busines id from query params
    const { searchParams } = new URL(req.url);
    const sale_id = searchParams.get("sale_id");
    
      if (!sale_id) {
      return NextResponse.json({ error: "Sale ID not provided" }, { status: 400 });
    }

    console.log("fetching receipt/invoice for: ", sale_id)
    const res = await fetch(`${process.env.BACKEND_URL}/business/receipts/${sale_id}`, {
        method: "GET",
        headers: {
      "Content-Type": "application/json",
       Authorization: `Bearer ${session.accessToken}`,
    },
    })

    if(!res.ok){
        return NextResponse.json({error: res.statusText}, {status: res.status})
    }
    

    const body = await res.json()
    console.log("fetched financial data", body)
    return NextResponse.json(body, {status: 200})
}

