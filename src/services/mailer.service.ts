// src/services/mailer.service.ts
import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const url = `${process.env.FRONTEND_URL}/verify?token=${token}&email=${email}`;
  return await getTransporter().sendMail({
    from: '"Online Grocery" <no-reply@grocery.com>',
    to: email,
    subject: "Verify your email address",
    html: `<p>Click <a href="${url}">here</a> to verify your account.</p>`,
  });
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${email}`;
  return await getTransporter().sendMail({
    from: '"Online Grocery" <no-reply@grocery.com>',
    to: email,
    subject: "Reset your password",
    html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
  });
};

