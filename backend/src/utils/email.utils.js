/**
 * Email Service (Mock implementation for now)
 * In production, wire this to Nodemailer, SendGrid, or AWS SES
 */
const sendEmail = async ({ to, subject, html }) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  console.log('--------------------------------------------------')
  console.log(`✉️ EMAIL INTERCEPTED (Mock Mode)`)
  console.log(`To: ${to}`)
  console.log(`Subject: ${subject}`)
  console.log(`Body:\n${html}`)
  console.log('--------------------------------------------------')

  return true
}

module.exports = { sendEmail }
