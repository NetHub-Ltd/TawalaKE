import { NextResponse } from "next/server";

export async function POST(req: Request) {
//   const apiKey = req.headers.get("x-api-key") ?? req.headers.get("api-key");
//   if (!apiKey) {
//     return NextResponse.json({ error: "API key missing" }, { status: 401 });
//   }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend URL not configured" }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const targetUrl = `${backendUrl}/organizations/onboarding`;
  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    //   "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  // const responseText = await response.text();
  // const contentType = response.headers.get("content-type") ?? "text/plain";
  const  data = await response.json()
  console.log("response data", data)

  return NextResponse.json(data.data, { status: 200 });
}
