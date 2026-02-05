import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, message, email, photo_url, unitNumber, propertyName } = body;

    console.log("🚀 Lancement de l'envoi d'email...");
    console.log("🔑 API Key présente ?", !!process.env.RESEND_API_KEY);

    // واش هذا هو الإيميل اللي تسجلتي بيه ف Resend؟
    const MANAGER_EMAIL = "moussaab.hilal@gmail.com"; 

    const { data, error } = await resend.emails.send({
      from: 'SaaS Immob <onboarding@resend.dev>',
      to: [MANAGER_EMAIL], // في Mode Test، هذا خاصو يكون هو مول الكونط
      subject: `🚨 Nouveau Ticket: ${type} - Unité ${unitNumber}`,
      html: `<p>Test Email</p>`, // ميساج قصير للتجربة
    });

    if (error) {
      console.error("❌ ERREUR RESEND:", error); // هادي غاتبان ليك فالترمينال بالأحمر
      return NextResponse.json({ error }, { status: 500 });
    }

    console.log("✅ Email envoyé avec succès:", data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("❌ ERREUR SERVEUR:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}