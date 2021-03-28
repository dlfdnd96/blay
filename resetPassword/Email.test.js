const Email = require('./Email');

jest.mock('nodemailer');

describe('Email', () => {
  const email = new Email({
    to: 'juuni.ni.i@gmail.com',
    from: 'no-reply@blay.com',
    subject: '패스워드가 초기화 되었습니다.',
    content: '<p>변경된 패스워드는 123456 입니다.</p>',
  });

  describe('send', () => {
    context('With correct given auth info', () => {
      /**
       * Real usage : `await email.google({ id, password }).send();`
       * googleTransporter is just for test.
       */
      const googleTransporter = email.google({
        id: 'no-reply@blay.com',
        password: 'secret',
      });
      googleTransporter.transporter = { sendMail: jest.fn() };

      it('Send mail success', async () => {
        expect(googleTransporter.transporter.sendMail).not.toBeCalled();

        await googleTransporter.send();

        expect(googleTransporter.transporter.sendMail).toBeCalled();
      });
    });
  });
});
