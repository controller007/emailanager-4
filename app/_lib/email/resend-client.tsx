import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is required")
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const emailConfig = {
  user: process.env.EMAIL_FROM || "noreply@yourdomain.com",
  fromName: process.env.EMAIL_FROM_NAME || "Email Management Platform",
}

export function generateEmailTemplate(content: string, subject: string): string {
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
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header { 
            background-color: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content { 
            padding: 30px;
          }
          .footer { 
            background-color: #f8f9fa;
            border-top: 1px solid #e9ecef; 
            padding: 20px; 
            text-align: center;
            font-size: 12px; 
            color: #6c757d; 
          }
          .footer a {
            color: #2563eb;
            text-decoration: none;
          }
          /* Rich text editor styles */
          .content h1, .content h2, .content h3 { color: #1f2937; margin-top: 0; }
          .content p { margin-bottom: 16px; }
          .content ul, .content ol { margin-bottom: 16px; padding-left: 20px; }
          .content blockquote { 
            border-left: 4px solid #2563eb; 
            margin: 16px 0; 
            padding-left: 16px; 
            font-style: italic;
            color: #6b7280;
          }
          .content img { max-width: 100%; height: auto; border-radius: 8px; }
          .content a { color: #2563eb; text-decoration: underline; }
          .content table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 16px 0; 
          }
          .content table th, .content table td { 
            border: 1px solid #e5e7eb; 
            padding: 8px 12px; 
            text-align: left; 
          }
          .content table th { 
            background-color: #f9fafb; 
            font-weight: 600; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${subject}</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>This email was sent from Email Management Platform</p>
            <p>
              <a href="#" style="color: #2563eb;">Unsubscribe</a> | 
              <a href="#" style="color: #2563eb;">Update Preferences</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}
