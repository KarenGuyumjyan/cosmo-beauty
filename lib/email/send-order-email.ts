import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

interface SendOrderEmailInput {
  email: string
  trackingLink: string
}

export async function sendOrderEmail({
  email,
  trackingLink,
}: SendOrderEmailInput) {
  await transporter.sendMail({
    from: `"Morena Cosmetics" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: 'Спасибо за ваш заказ! 💙',
    text: `Здравствуйте!

Благодарим вас за заказ в Morena Cosmetics.

Мы уже получили ваш заказ и приступили к его обработке.

Отслеживать статус заказа можно по ссылке:
${trackingLink}

Если у вас возникнут вопросы, мы всегда будем рады помочь.

С уважением,
Команда Morena Cosmetics`,

    html: `
    <p>Здравствуйте!</p>

    <p>Благодарим вас за заказ в <strong>Morena Cosmetics</strong>.</p>

    <p>Мы уже получили ваш заказ и приступили к его обработке.</p>

    <p>
      <strong>Отследить статус вашего заказа:</strong><br />
      <a href="${trackingLink}">${trackingLink}</a>
    </p>

    <p>Если у вас возникнут вопросы, мы всегда будем рады помочь.</p>

    <p>
      С уважением,<br />
      <strong>Команда Morena Cosmetics</strong>
    </p>
  `,
  })
}
