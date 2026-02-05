import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  // 1. شوف واش الساروت كاين ولا لا (غايبان فاللوغز)
  console.log("🔑 API KEY Status:", process.env.RESEND_API_KEY ? "✅ Exist" : "❌ MISSING");

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const body = await request.json();
    const { type, message, email, photo_url, unitNumber, propertyName } = body;
    
    // تأكد أن هاد الإيميل هو نيت باش فتحتي Resend
    const MANAGER_EMAIL = "moussaab.hilal@gmail.com"; 

    console.log("📩 Attempting to send email to:", MANAGER_EMAIL);

    const { data, error } = await resend.emails.send({
      from: 'SaaS Immob <onboarding@resend.dev>',
      to: [MANAGER_EMAIL],
      subject: `🚨 Nouveau Ticket: ${type}`,
      headers: { "Reply-To": email },
      html: `<p>${message}</p>`
    });

    if (error) {
      console.error("❌ Resend Error:", error); // هادي غاتبان حمراء
      return NextResponse.json({ error }, { status: 500 });
    }

    console.log("✅ Email Sent Successfully!");
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("💥 CRASH Error:", error.message); // هادي غاتعطينا السبب الحقيقي
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}