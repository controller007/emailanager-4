import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is required")
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const emailConfig = {
  user: process.env.EMAIL_FROM || "noreply@yourdomain.com",
  fromName: process.env.EMAIL_FROM_NAME || "Email Management Platform",
}

export function generateEmailTemplate(
  content: string,
  subject: string,
  recipientName = "there"
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f1f1f1;
            color: #111827;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            padding: 32px 24px;
            border-radius: 6px;
          }
          .content p {
            margin: 0 0 16px 0;
            font-size: 15px;
            line-height: 1.6;
            color: #374151;
          }
          .content a {
            color: #2563eb;
            text-decoration: underline;
          }
          .signature {
            margin-top: 32px;
            font-weight: 700;
            font-size: 14px;
            color: #111827;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            ${content}
            <p class="signature">Coach JV</p>
          </div>
        </div>
      </body>
    </html>
  `;
}


