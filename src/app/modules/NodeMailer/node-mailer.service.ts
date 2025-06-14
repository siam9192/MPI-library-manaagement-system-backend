import transporter from './node-mailer.config';
import ejs from 'ejs';
import { ISendEmailPayload } from './node-mailer.interface';
import path from 'path';

class NodeMailerService {
  async sendEmail(payload: ISendEmailPayload) {
    await ejs.renderFile(
      path.join(process.cwd(), payload.path),
      payload.data,
      async function (err, template) {
        if (err) {
          throw new Error();
        } else {
          await transporter.sendMail({
            from: 'gadgetgalaxy@gmail.com',
            to: payload.emailAddress,
            subject: payload.subject,
            html: template,
          });
        }
      }
    );
  }
}
export default new NodeMailerService();
