import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, message, email, unitNumber, propertyName } = body;

    // 1. إعدادات Gmail (كيجيب السوارت من Environment Variables)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    // 2. شكل الرسالة
    const mailOptions = {
      from: `"ProprioZen" <${process.env.EMAIL_USER}>`,
      to: "moussaab.hilal@gmail.com", // الإيميل ديالك الشخصي
      replyTo: email, // باش تجاوب الكاري نيشان
      subject: `🚨 Ticket: ${type} - ${propertyName} (Unité ${unitNumber})`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #000;">Nouveau Signalement 🛠️</h2>
          <p><strong>Locataire:</strong> ${email}</p>
          <p><strong>Unité:</strong> ${unitNumber}</p>
          <p><strong>Immeuble:</strong> ${propertyName || 'Non spécifié'}</p>
          <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
            <strong>Message:</strong><br/>
            ${message}
          </div>
        </div>
      `,
    };

    // 3. صيفط
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ Email Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}