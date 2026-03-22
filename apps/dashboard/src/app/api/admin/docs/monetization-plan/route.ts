import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const docPath = "/Users/Marco/Documents/Company/Crypto/Pandoras/dApps/saaspandoras/saaspandoras/apps/dashboard/docs/MONETIZATION_MASTER_PLAN.md";
    
    if (!fs.existsSync(docPath)) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const content = fs.readFileSync(docPath, "utf-8");
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error reading monetization plan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
