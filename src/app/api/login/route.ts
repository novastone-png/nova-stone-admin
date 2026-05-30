import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const correctPassword = process.env.ADMIN_PASSWORD;

    if (!correctPassword) {
      return NextResponse.json({ error: "Server password configuration missing" }, { status: 500 });
    }

    if (password === correctPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Authentication error" }, { status: 500 });
  }
}
