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
    const business_id = searchParams.get("business_id");
    const sale_id = searchParams.get("sale_id");
    
      if (!business_id) {
      return NextResponse.json({ error: "Business ID not provided" }, { status: 400 });
    }

    const targetUrl = sale_id 
      ? `${process.env.BACKEND_URL}/business/get-sales/${business_id}?sale_id=${sale_id}`
      : `${process.env.BACKEND_URL}/business/get-sales/${business_id}`;

    console.log("fetching sales for: ", business_id)
    const res = await fetch(targetUrl, {
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
<<<<<<< HEAD
    console.log("Fetched Sales Object", body)
=======

    // TODO: check if body is an array
>>>>>>> frontend
    return NextResponse.json(body, {status: 200})
}


export async function POST(req: NextRequest){
// check session and return a 401 if the user is not authorized

const session = await auth()

if(!session?.accessToken){
    return NextResponse.json({error: "Authorized"}, {status: 410})
}

const body = await req.json()

if(!body){
    return NextResponse.json({error: "Body is required"}, {status: 400})
}


const res = await fetch(`${process.env.BACKEND_URL}/business/create-sale`, {
    method: "POST",
    headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(body),
})

if(!res.ok){
    console.error(res.text)
    return NextResponse.json({error: "An error occured"}, {status: 500})
}

const data = await res.json()
  if (!data) {
        return NextResponse.json({ error: data.message }, { status: res.status });
    }
console.debug("Saved Sale Object", data)
return NextResponse.json(data, {status: 200})

}