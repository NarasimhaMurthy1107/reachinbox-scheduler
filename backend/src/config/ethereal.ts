import nodemailer, { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;
let testAccount: nodemailer.TestAccount | null = null;

export async function getTransporter(): Promise<Transporter> {
  if (!transporter) {
    if (!testAccount) {
      testAccount = await nodemailer.createTestAccount();
      console.log('✅ Created Ethereal test account:', testAccount.user);
    }
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  return transporter;
}

export function getPreviewUrl(info: any): string | false {
  return nodemailer.getTestMessageUrl(info);
}
