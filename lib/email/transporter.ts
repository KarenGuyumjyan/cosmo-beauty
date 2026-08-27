import nodemailer from 'nodemailer'

/**
 * Shared SMTP transport. Nodemailer pools connections per transport instance,
 * so every outgoing mail must reuse this one rather than creating its own.
 */
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export const MAIL_FROM = `"Morena Cosmetics" <${process.env.SMTP_FROM}>`
