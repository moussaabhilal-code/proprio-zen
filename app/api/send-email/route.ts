import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, message, email, photo_url, unitNumber, propertyName } = body;
    const MANAGER_EMAIL = "moussaab.hilal@gmail.com"; 

    const { data, error } = await resend.emails.send({
      from: 'SaaS Immob <onboarding@resend.dev>',
      to: [MANAGER_EMAIL],
      subject: `🚨 Nouveau Ticket: ${type} - Unité ${unitNumber}`,
      // ✅ التصحيح: هكا كتكتب باش Typescript ما يبكيش
      headers: {
        "Reply-To": email,
      },
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Nouveau Signalement 🛠️</h2>
          <p><strong>De:</strong> ${email}</p>
          <p><strong>Unité:</strong> ${unitNumber}</p>
          <hr/>
          <p>${message}</p>
          ${photo_url ? `<br/><img src="${photo_url}" width="300" style="border-radius:10px;"/>` : ''}
        </div>
      `,
    });

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}