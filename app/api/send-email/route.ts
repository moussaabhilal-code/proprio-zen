import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, to, unitNumber, category, message, reply, link } = body;

    // 1. إعداد "الموزع" (Transporter) ديال Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // إيميلك
        pass: process.env.GMAIL_PASS, // كود التطبيق
      },
    });

    // 2. تجهيز الميساج
    let subject = "";
    let htmlContent = "";

    if (type === 'NEW_TICKET') {
      subject = `🚨 ALERTE: ${category} - Unité ${unitNumber}`;
      htmlContent = `
        <h2>Nouveau Signalement 🛠️</h2>
        <p><strong>Unité :</strong> ${unitNumber}</p>
        <p><strong>Type :</strong> ${category}</p>
        <p><strong>Message :</strong> ${message}</p>
        <br/>
        <p><em>Connectez-vous à l'admin pour répondre.</em></p>
      `;
    } else if (type === 'REPLY_TICKET') {
      subject = `💬 Réponse Gestionnaire - Unité ${unitNumber}`;
      htmlContent = `
        <h2>Nouvelle Réponse 💬</h2>
        <p>Le gestionnaire a répondu :</p>
        <blockquote style="background:#f0f0f0; padding:10px; border-left:4px solid blue;">
          ${reply}
        </blockquote>
        <p>Voir le ticket : <a href="${link}">${link}</a></p>
      `;
    }

    console.log(`📤 Tentative d'envoi via Gmail vers : ${to}`);

    // 3. الإرسال الفعلي
    const info = await transporter.sendMail({
      from: `"Proprio Zen" <${process.env.GMAIL_USER}>`, // كيصيفط بسميتك
      to: to,
      subject: subject,
      html: htmlContent,
    });

    console.log("✅ Email envoyé (Gmail ID):", info.messageId);
    return NextResponse.json({ success: true, messageId: info.messageId });

  } catch (error: any) {
    console.error("❌ Erreur Gmail:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}