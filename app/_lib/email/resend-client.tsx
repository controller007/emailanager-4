import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is required")
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const emailConfig = {
  user: process.env.EMAIL_FROM || "noreply@yourdomain.com",
  fromName: process.env.EMAIL_FROM_NAME || "Email Management Platform",
}

export function generateEmailTemplate(content: string, subject: string, domainName = emailConfig.fromName): string {
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
            background-color: #f1f5f9;
            color: #111827;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #f8fcff;
          }
          .content {
            padding: 32px 24px;
          }
          .content h1 {
            margin: 0 0 16px 0;
            font-size: 20px;
            font-weight: 600;
            color: #111827;
          }
          .content p {
            margin: 0 0 16px 0;
            font-size: 14px;
            line-height: 1.6;
            color: #374151;
          }
          .content a {
            color: #2563eb;
            text-decoration: underline;
          }
          .footer {
            background-color: #0080ff;
            color: #ffffff;
            text-align: center;
            padding: 20px;
            font-size: 13px;
          }
          .footer p {
            margin: 4px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1>${subject}</h1>
            ${content}
          </div>
          <div class="footer">
            <p>${domainName}</p>
            <p>Copyright © ${new Date().getFullYear()} All rights reserved</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

