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

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#00997a 0%,#007a61 100%);padding:36px 40px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">🛒</div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Grosur</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Belanja Hemat, Hidup Nyaman</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Grosur. Semua hak dilindungi.</p>
              <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const sendVerificationEmail = async (email: string, token: string) => {
  const url = `${process.env.FRONTEND_URL}/verify?token=${token}&email=${encodeURIComponent(email)}`;
  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;background:#e6f7f3;border-radius:50%;font-size:36px;">✉️</div>
    </div>
    <h2 style="margin:0 0 8px;font-size:24px;color:#0f172a;font-weight:800;text-align:center;">Satu Langkah Lagi!</h2>
    <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;text-align:center;">
      Hei! Kami menerima pendaftaran untuk <strong style="color:#334155;">${email}</strong>.<br/>
      Klik tombol di bawah untuk mengaktifkan akun dan membuat password Anda.
    </p>

    <!-- Steps -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td style="text-align:center;width:33%;">
          <div style="width:36px;height:36px;background:#00997a;border-radius:50%;line-height:36px;color:#fff;font-weight:700;font-size:14px;margin:0 auto 8px;">1</div>
          <p style="margin:0;font-size:11px;color:#00997a;font-weight:700;">Daftar Email<br/>✓ Selesai</p>
        </td>
        <td style="padding-top:18px;">
          <div style="border-top:2px dashed #d1fae5;"></div>
        </td>
        <td style="text-align:center;width:33%;">
          <div style="width:36px;height:36px;background:#fff;border:2px solid #00997a;border-radius:50%;line-height:32px;color:#00997a;font-weight:700;font-size:14px;margin:0 auto 8px;">2</div>
          <p style="margin:0;font-size:11px;color:#00997a;font-weight:700;">Verifikasi<br/>← Anda di sini</p>
        </td>
        <td style="padding-top:18px;">
          <div style="border-top:2px dashed #e2e8f0;"></div>
        </td>
        <td style="text-align:center;width:33%;">
          <div style="width:36px;height:36px;background:#f1f5f9;border-radius:50%;line-height:36px;color:#94a3b8;font-weight:700;font-size:14px;margin:0 auto 8px;">3</div>
          <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600;">Mulai Belanja</p>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <div style="text-align:center;margin:0 0 28px;">
      <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#00997a,#007a61);color:#ffffff;text-decoration:none;font-weight:800;font-size:16px;padding:18px 48px;border-radius:50px;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(0,153,122,0.4);">
        ✅ &nbsp;Aktifkan Akun Sekarang
      </a>
    </div>

    <!-- Referral bonus -->
    <div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #fde68a;border-radius:14px;padding:18px 20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:800;color:#92400e;">🎁 &nbsp;Bonus Untuk Anda!</p>
      <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6;">Jika Anda mendaftar dengan kode referral teman, voucher belanja <strong>Rp 25.000</strong> sudah menunggu di akun Anda setelah verifikasi!</p>
    </div>

    <!-- Expiry notice -->
    <div style="background:#f8fafc;border-radius:10px;padding:12px 16px;text-align:center;border:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#64748b;">⏰ Link berlaku <strong>1 jam</strong>. Tidak bisa klik? Salin link berikut:</p>
      <p style="margin:6px 0 0;font-size:10px;color:#94a3b8;word-break:break-all;">${url}</p>
    </div>
  `;
  return await getTransporter().sendMail({
    from: '"Grosur 🛒" <no-reply@grosur.id>',
    to: email,
    subject: "✅ Aktifkan Akun Grosur Anda",
    html: emailWrapper(content),
  });
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;background:#fef2f2;border-radius:50%;font-size:36px;">🔑</div>
    </div>
    <h2 style="margin:0 0 8px;font-size:24px;color:#0f172a;font-weight:800;text-align:center;">Reset Password</h2>
    <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;text-align:center;">
      Kami menerima permintaan untuk mereset password akun <strong style="color:#334155;">${email}</strong>.<br/>
      Klik tombol di bawah untuk membuat password baru.
    </p>

    <div style="text-align:center;margin:0 0 28px;">
      <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#ffffff;text-decoration:none;font-weight:800;font-size:16px;padding:18px 48px;border-radius:50px;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(239,68,68,0.35);">
        🔑 &nbsp;Reset Password Sekarang
      </a>
    </div>

    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:14px;padding:16px 20px;text-align:center;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.6;">🔒 Jika Anda tidak meminta reset password, <strong>abaikan email ini</strong>. Password Anda tidak akan berubah.</p>
    </div>

    <div style="background:#f8fafc;border-radius:10px;padding:12px 16px;text-align:center;border:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#64748b;">⏰ Link berlaku <strong>1 jam</strong>. Tidak bisa klik? Salin link berikut:</p>
      <p style="margin:6px 0 0;font-size:10px;color:#94a3b8;word-break:break-all;">${url}</p>
    </div>
  `;
  return await getTransporter().sendMail({
    from: '"Grosur 🛒" <no-reply@grosur.id>',
    to: email,
    subject: "🔑 Reset Password Akun Grosur",
    html: emailWrapper(content),
  });
};
