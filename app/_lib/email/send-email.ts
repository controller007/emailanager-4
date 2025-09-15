export default async function sendEmail(
  to: string,
  subject: string,
  html: string,
  save?: boolean,
  attachments: any[] = [],
) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = `Ship Market Square <${emailConfig.user}>`
  const htmlNew = generateEmailTemplate(html, subject)

  // Prepare message object for both Resend and potential IMAP saving
  console.log("Sending email to", htmlNew)

  const message = {
    from: fromEmail,
    to,
    subject,
    html: htmlNew,
    attachments,
  }

  try {
    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: to,
      subject: subject,
      html: htmlNew,
      attachments: attachments.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
      })),
    })

    if (error) {
      throw new Error(error.message)
    }

    console.log("Email sent successfully with Resend")

    // If save is true, save to sent folder using the existing IMAP functionality
    if (save) {
      await saveToSentFolder({ ...message, html })
    }

    return { success: true, message: "Email sent and saved successfully", id: data?.id }
  } catch (error) {
    console.error("Error:", error)
    return { success: false, message: "Failed to send or save email" }
  }
}
