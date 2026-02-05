import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// ⚠️ مادير والو هنا الفوق، باش Vercel ما يتبلوكاش فالبناء

export async function POST(request: Request) {
  try {
    // ✅ هنا فين كنعرفو Resend (لداخل)، باش يخدم غير ملي نحتاجوه
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const body = await request.json();
    const { type, message, email, photo_url, unitNumber, propertyName } = body;
    
    // الإيميل ديالك نتا مول الشي
    const MANAGER_EMAIL = "moussaab.hilal@gmail.com"; 

    const { data, error } = await resend.emails.send({
      from: 'SaaS Immob <onboarding@resend.dev>',
      to: [MANAGER_EMAIL],
      subject: `🚨 Nouveau Ticket: ${type} - Unité ${unitNumber}`,
      // ✅ هكا كتكتب Reply-To باش ما يكونش خطأ ف TypeScript
      headers: {
        "Reply-To": email,
      },
      html: `
        <div style="font-family: sans-serif; border: 1px solid #eaeaea; border-radius: 10px; padding: 20px; max-width: 600px;">
          <h2 style="color: #000;">Nouveau Signalement 🛠️</h2>
          <p><strong>Immeuble:</strong> ${propertyName || 'Non spécifié'}</p>
          <p><strong>Unité:</strong> ${unitNumber}</p>
          <p><strong>Locataire:</strong> ${email}</p>
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
            <p style="margin: 0; font-weight: bold; color: #555;">Problème (${type}):</p>
            <p style="margin-top: 5px; font-size: 16px;">${message}</p>
          </div>

          ${photo_url ? `
            <div style="margin-top: 20px;">
              <p><strong>Photo jointe:</strong></p>
              <img src="${photo_url}" alt="Ticket Photo" style="width: 100%; max-width: 400px; border-radius: 8px; border: 1px solid #ccc;" />
            </div>
          ` : ''}
          
          <p style="font-size: 12px; color: #888; margin-top: 30px; text-align: center;">Envoyé depuis ProprioZen SaaS</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}