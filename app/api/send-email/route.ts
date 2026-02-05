import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    // ✅ Resend داخلة هنا باش ما تحبسش البناء
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const body = await request.json();
    const { type, message, email, photo_url, unitNumber, propertyName } = body;
    const MANAGER_EMAIL = "moussaab.hilal@gmail.com"; 

    const { data, error } = await resend.emails.send({
      from: 'SaaS Immob <onboarding@resend.dev>',
      to: [MANAGER_EMAIL],
      subject: `🚨 Nouveau Ticket: ${type} - Unité ${unitNumber}`,
      headers: { "Reply-To": email }, // ✅ الكتابة الصحيحة
      html: `
        <p><strong>Nouveau Ticket</strong></p>
        <p>Message: ${message}</p>
        <p>De: ${email}</p>
      `,
    });

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
// 🚀 DEBLOCAGE VERCEL