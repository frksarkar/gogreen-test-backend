import nodemailer from "nodemailer";
import config from "../config";
import path from "path";
import ejs from "ejs";
import ApiError from "../errors/ApiError";

const transport = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: true,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

interface ISendMailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateData?: Record<string, any>;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
}
export const sendMail = async ({
  to,
  subject,
  templateName,
  templateData,
  attachments,
}: ISendMailOptions) => {
  try {
    await transport.verify();
    console.log("Transport is ok");
    const templatePath = path.join(
      __dirname,
      `./templates/${templateName}.ejs`,
    );
    const html = await ejs.renderFile(templatePath, templateData);
    const info = await transport.sendMail({
      from: config.smtp.from,
      to: to,
      subject: subject,
      html: html,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });
    console.log(`\u2709\uFE0F Email Sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.log(error);
    throw new ApiError(404, "Error sending email");
  }
};
