import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, company, email, phone, message } = body;

    if (!name || !company || !email) {
      return NextResponse.json(
        { error: "姓名、公司和邮箱为必填项" },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "请输入有效的邮箱地址" },
        { status: 400 }
      );
    }

    const inquiry = await db.inquiry.create({
      data: {
        name: name.trim(),
        company: company.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        message: message?.trim() || null,
      },
    });

    return NextResponse.json(
      { success: true, id: inquiry.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Inquiry submission error:", error);
    return NextResponse.json(
      { error: "提交失败，请稍后重试" },
      { status: 500 }
    );
  }
}
