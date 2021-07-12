import { promises as fs } from 'fs';
import { createTransport } from 'nodemailer';
import { join } from 'path';

const EMAIL_CONTENT_PATH = 'public/welcome.html';
const EMAIL_SUBJECT = 'PlayBus 이메일 주소 인증 요청';
const EMAIL_AUTH_URI = 'signup/authenticated';

function injectDataToEmail(template: string, vars: { [keys in string]: string } = {}): string {
  let injectedEmail = '';
  Object.keys(vars).forEach((key) => {
    const regex = new RegExp(`{${key}}`, 'g');
    injectedEmail = template.replace(regex, vars[key]);
  });

  return injectedEmail;
}

export default async function sendVerificationEmail(emailAddress: string): Promise<void> {
  const emailTemplate = await fs.readFile(join(__dirname, EMAIL_CONTENT_PATH), 'utf8');
  const content = injectDataToEmail(emailTemplate, {
    completeJoinUrl: `${process.env.HOST_FRONT_URL as string}/${EMAIL_AUTH_URI}`,
  });
  await createTransport({
    service: process.env.GMAIL_SERVICE,
    host: process.env.GMAIL_HOST,
    port: 456,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  })
    .sendMail({
      from: process.env.GMAIL_USER,
      to: emailAddress,
      subject: EMAIL_SUBJECT,
      html: content,
    });
}
