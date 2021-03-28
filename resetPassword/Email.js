const nodemailer = require('nodemailer');

/**
 * Send Email.
 */
class Email {
  /**
   * @param {Object} props
   * @param {String} props.to Receiver email address
   * @param {String} props.from Sender email address
   * @param {String} props.subject Email Title
   * @param {String} props.content Email Content (HTML)
   * @param {Mail} props.transporter nodemailer transporter
   */
  constructor({
    to,
    from,
    subject,
    content,
    transporter,
  }) {
    this.to = to;
    this.from = from;
    this.subject = subject;
    this.content = content;
    this.transporter = transporter;
  }

  /**
   * @param {Object} props
   * @param {String} props.id Google id
   * @param {String} props.password Google password
   *
   * @returns {Email} With Google transporter.
   */
  google({ id, password }) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      host: 'smtp.gmail.com',
      secure: false,
      requireTLS: true,
      auth: {
        user: id,
        pass: password,
      },
    });

    return new Email({
      to: this.to,
      from: this.from,
      subject: this.subject,
      content: this.content,
      transporter,
    });
  }

  /**
   * Send email.
   *
   * @returns {Promise<SentMessageInfo>} nodemailer transporter sendMail method result.
   */
  send() {
    return this.transporter.sendMail({
      to: this.to,
      from: this.from,
      subject: this.subject,
      html: this.content,
    });
  }
}

module.exports = Email;
