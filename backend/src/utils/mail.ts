import Mailgen, { Content } from "mailgen";
import nodemailer from "nodemailer";
import logger from "../logger/winston.logger.js";

// Define Product interface for order mail content
interface Product {
  name: string;
  price: number;
}

// Define the email options type
interface SendEmailOptions {
  email: string;
  subject: string;
  mailgenContent: Content;
}

/**
 * Sends an email using Mailgen + Nodemailer
 * @param options - email details
 */
export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "FreeAPI",
      link: "https://freeapi.app",
    },
  });

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHtml = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: Number(process.env.MAILTRAP_SMTP_PORT),
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });

  const mail = {
    from: "mail.freeapi@gmail.com",
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    logger.error(
      "Email service failed silently. Make sure you have provided your MAILTRAP credentials in the .env file"
    );
    logger.error("Error: ", error);
  }
};

/**
 * Designs the email verification mail
 * @param username - user name
 * @param verificationUrl - verification link
 * @returns Mailgen content
 */
export const emailVerificationMailgenContent = (
  // username: string,
  verificationUrl: string
): Content => ({
  body: {
    // name: username,
    intro: "Welcome to our app! We're very excited to have you on board.",
    action: {
      instructions: "To verify your email please click on the following button:",
      button: {
        color: "#22BC66",
        text: "Verify your email",
        link: verificationUrl,
      },
    },
    outro:
      "Need help, or have questions? Just reply to this email, we'd love to help.",
  },
});

/**
 * Designs the forgot password mail
 * @param username - user name
 * @param passwordResetUrl - reset link
 * @returns Mailgen content
 */
export const forgotPasswordMailgenContent = (
  username: string,
  passwordResetUrl: string
): Content => ({
  body: {
    name: username,
    intro: "We got a request to reset the password of your account.",
    action: {
      instructions:
        "To reset your password click on the following button or link:",
      button: {
        color: "#22BC66",
        text: "Reset password",
        link: passwordResetUrl,
      },
    },
    outro:
      "Need help, or have questions? Just reply to this email, we'd love to help.",
  },
});

/**
 * Designs the order confirmation mail (invoice style)
 * @param username - user name
 * @param items - ordered items with quantity and product details
 * @param totalCost - total order amount
 * @returns Mailgen content
 */
export const orderConfirmationMailgenContent = (
  username: string,
  items: { _id: string; product: Product; quantity: number }[],
  totalCost: number
): Content => ({
  body: {
    name: username,
    intro: "Your order has been processed successfully.",
    table: {
      data: items?.map((item) => ({
        item: item.product?.name,
        price: `INR ${item.product?.price}/-`,
        quantity: item.quantity,
      })),
      columns: {
        customWidth: {
          item: "20%",
          price: "15%",
          quantity: "15%",
        },
        customAlignment: {
          price: "right",
          quantity: "right",
        },
      },
    },
    outro: [
      `Total order cost: INR ${totalCost}/-`,
      "You can check the status of your order and more in your order history.",
    ],
  },
});
