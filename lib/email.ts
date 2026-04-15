import nodemailer from "nodemailer";

const ADMIN_EMAIL = "viraj@theagentfactory.io";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || "ahmed@theagentfactory.io",
    pass: process.env.GMAIL_PASS || "gbcx dged xqtk iarn",
  },
});

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: string; encoding: string }[];
}) {
  console.log(`[Email] Sending to: ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`);
  console.log(`[Email] Subject: ${options.subject}`);

  const result = await transporter.sendMail({
    from: process.env.GMAIL_USER || "ahmed@theagentfactory.io",
    ...options,
  });

  console.log(`[Email] Sent successfully. MessageId: ${result.messageId}`);
  return result;
}

export async function sendSigningLink(params: {
  to: string;
  receivingPartyName: string;
  token: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const signingUrl = `${baseUrl}/nda/${params.token}`;

  // Send signing link to receiving party
  try {
    await sendEmail({
      to: params.to,
      subject: "NDA Signature Request from The Agent Factory",
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A2E; color: #FFFFFF; padding: 40px; border-radius: 12px;">
          <h1 style="color: #0D7377; font-size: 24px; margin-bottom: 8px;">The Agent Factory</h1>
          <p style="color: #94A3B8; font-size: 14px; margin-bottom: 32px;">Non-Disclosure Agreement</p>

          <p style="font-size: 16px; line-height: 1.6;">Dear ${params.receivingPartyName},</p>

          <p style="font-size: 14px; line-height: 1.6; color: #94A3B8;">
            You have been invited to review and sign a Non-Disclosure Agreement with The Agent Factory, Inc.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${signingUrl}" style="background: #0D7377; color: #FFFFFF; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
              Review & Sign NDA
            </a>
          </div>

          <p style="font-size: 12px; color: #94A3B8; line-height: 1.6;">
            This link will expire in 30 days. If you have questions, please contact us at viraj@theagentfactory.io.
          </p>

          <hr style="border: none; border-top: 1px solid #1E293B; margin: 32px 0;" />

          <p style="font-size: 11px; color: #64748B;">
            The Agent Factory, Inc. / Mortgages.ai<br/>
            37-02 Astoria Blvd, Astoria, New York 11103
          </p>
        </div>
      `,
    });
    console.log(`[Email] Signing link sent to receiving party: ${params.to}`);
  } catch (err) {
    console.error(`[Email] Failed to send signing link to ${params.to}:`, err);
    throw err;
  }

  // Send confirmation to admin (separate call so receiving party email is not blocked)
  try {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `NDA Sent to ${params.receivingPartyName}`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A2E; color: #FFFFFF; padding: 40px; border-radius: 12px;">
          <h1 style="color: #0D7377; font-size: 24px; margin-bottom: 8px;">The Agent Factory</h1>
          <p style="color: #94A3B8; font-size: 14px; margin-bottom: 32px;">NDA Notification</p>

          <p style="font-size: 16px; line-height: 1.6;">An NDA signing request has been sent.</p>

          <div style="background: #16213E; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="font-size: 14px; color: #94A3B8; margin: 0 0 8px 0;"><strong style="color: #FFFFFF;">Receiving Party:</strong> ${params.receivingPartyName}</p>
            <p style="font-size: 14px; color: #94A3B8; margin: 0 0 8px 0;"><strong style="color: #FFFFFF;">Email:</strong> ${params.to}</p>
            <p style="font-size: 14px; color: #94A3B8; margin: 0;"><strong style="color: #FFFFFF;">Signing Link:</strong> <a href="${signingUrl}" style="color: #0D7377;">${signingUrl}</a></p>
          </div>

          <p style="font-size: 12px; color: #94A3B8; line-height: 1.6;">
            The receiving party has 30 days to sign this agreement.
          </p>

          <hr style="border: none; border-top: 1px solid #1E293B; margin: 32px 0;" />

          <p style="font-size: 11px; color: #64748B;">
            The Agent Factory, Inc. / Mortgages.ai<br/>
            37-02 Astoria Blvd, Astoria, New York 11103
          </p>
        </div>
      `,
    });
    console.log(`[Email] Admin notification sent to ${ADMIN_EMAIL}`);
  } catch (err) {
    console.error(`[Email] Failed to send admin notification to ${ADMIN_EMAIL}:`, err);
    // Don't throw - admin email failure should not block the flow
  }
}

export async function sendSignedNdaNotification(params: {
  to: string;
  receivingPartyName: string;
  pdfBase64: string;
}) {
  // Send to receiving party
  try {
    await sendEmail({
      to: params.to,
      subject: "NDA Fully Executed - Certificate Attached",
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A2E; color: #FFFFFF; padding: 40px; border-radius: 12px;">
          <h1 style="color: #0D7377; font-size: 24px; margin-bottom: 8px;">The Agent Factory</h1>
          <p style="color: #94A3B8; font-size: 14px; margin-bottom: 32px;">NDA Fully Executed</p>

          <p style="font-size: 16px; line-height: 1.6;">The Non-Disclosure Agreement with <strong>${params.receivingPartyName}</strong> has been fully signed.</p>

          <p style="font-size: 14px; line-height: 1.6; color: #94A3B8;">
            A copy of the signed NDA is attached to this email for your records.
          </p>

          <hr style="border: none; border-top: 1px solid #1E293B; margin: 32px 0;" />

          <p style="font-size: 11px; color: #64748B;">
            The Agent Factory, Inc. / Mortgages.ai<br/>
            37-02 Astoria Blvd, Astoria, New York 11103
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `NDA-${params.receivingPartyName.replace(/\s+/g, "_")}.pdf`,
          content: params.pdfBase64,
          encoding: "base64",
        },
      ],
    });
    console.log(`[Email] Signed NDA sent to receiving party: ${params.to}`);
  } catch (err) {
    console.error(`[Email] Failed to send signed NDA to ${params.to}:`, err);
  }

  // Send to admin separately
  try {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: "NDA Fully Executed - Certificate Attached",
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A2E; color: #FFFFFF; padding: 40px; border-radius: 12px;">
          <h1 style="color: #0D7377; font-size: 24px; margin-bottom: 8px;">The Agent Factory</h1>
          <p style="color: #94A3B8; font-size: 14px; margin-bottom: 32px;">NDA Fully Executed</p>

          <p style="font-size: 16px; line-height: 1.6;">The Non-Disclosure Agreement with <strong>${params.receivingPartyName}</strong> has been fully signed.</p>

          <p style="font-size: 14px; line-height: 1.6; color: #94A3B8;">
            A copy of the signed NDA is attached to this email for your records.
          </p>

          <hr style="border: none; border-top: 1px solid #1E293B; margin: 32px 0;" />

          <p style="font-size: 11px; color: #64748B;">
            The Agent Factory, Inc. / Mortgages.ai<br/>
            37-02 Astoria Blvd, Astoria, New York 11103
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `NDA-${params.receivingPartyName.replace(/\s+/g, "_")}.pdf`,
          content: params.pdfBase64,
          encoding: "base64",
        },
      ],
    });
    console.log(`[Email] Signed NDA sent to admin: ${ADMIN_EMAIL}`);
  } catch (err) {
    console.error(`[Email] Failed to send signed NDA to admin ${ADMIN_EMAIL}:`, err);
  }
}
