// src/services/mailer.service.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (email: string, token: string) => {
  const url = `${process.env.FRONTEND_URL}/verify?token=${token}&email=${email}`;
  return await transporter.sendMail({
    from: '"Online Grocery" <no-reply@grocery.com>',
    to: email,
    subject: "Verify your email address",
    html: `<p>Click <a href="${url}">here</a> to verify your account.</p>`,
  });
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${email}`;
  return await transporter.sendMail({
    from: '"Online Grocery" <no-reply@grocery.com>',
    to: email,
    subject: "Reset your password",
    html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
  });
};