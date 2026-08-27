import { MAIL_FROM, transporter } from './transporter'

interface SendOrderEmailInput {
  email: string
  trackingLink: string
}

export async function sendOrderEmail({
  email,
  trackingLink,
}: SendOrderEmailInput) {
  await transporter.sendMail({
    from: MAIL_FROM,
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
