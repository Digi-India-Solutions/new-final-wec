const nodemailer = require("nodemailer");
const SuperAdmin = require("../src/super-admin/super-admin-model");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const puppeteer = require("puppeteer");


const getSuperAdminEmail = async () => {
    try {
        const superAdmin = await SuperAdmin.find();
        return superAdmin[0].email;
    } catch (e) {
    }
}

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_EMAIL_HOST, // Replace with your SMTP server host
    port: process.env.MAIL_EMAIL_PORT, // Replace with your SMTP server port
    secure: true,
    auth: {
        user: process.env.MAIL_EMAIL_ID, // Replace with your SMTP server username
        pass: process.env.MAIL_EMAIL_PASSWORD, // Replace with your SMTP server password
    },
});

const sendMail = ({ to, subject, html, from = process.env.MAIL_EMAIL_ID }) => {
    return new Promise((resolve, reject) => {
        const mailOptions = {
            from: `WEC Management System <${process.env.MAIL_EMAIL_ID}>`,
            to,
            subject,
            html,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return reject(error);
            }
            resolve(info);
        });
    });
};

exports.sendResetPasswordSuperAdmin = async (data) => {
    const { email, token, user } = data;
    const resetLink = `${process.env.BASE_URL}/${user}/reset-password/${token}`;

    const body = `
  <!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Reset Your Password - WEC Management System</title>
      <style>
          body {
              margin: 0;
              padding: 0;
              background-color: #f4f6f8;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
          }
          .container {
              max-width: 600px;
              background-color: #ffffff;
              border: 1px solid #e0e0e0;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.05);
              text-align: center;
          }
          .logo {
              margin-bottom: 20px;
          }
          .title {
              font-size: 24px;
              color: #1e293b;
              font-weight: 600;
              margin-top: 10px;
              margin-bottom: 20px;
          }
          .message {
              font-size: 16px;
              color: #334155;
              margin-bottom: 30px;
              line-height: 1.6;
              text-align: left;
          }
          .button {
              display: inline-block;
              background-color: #2563eb;
              color: #ffffff !important;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 600;
              margin-top: 10px;
              transition: background-color 0.3s ease;
          }
          .button:hover {
              background-color: #1d4ed8;
          }
          .footer {
              font-size: 12px;
              color: #6b7280;
              text-align: center;
              margin-top: 30px;
              line-height: 1.5;
          }
      </style>
  </head>
  
  <body>
      <div class="container">
          <div class="logo">
              <img src="${process.env.BASE_URL}/image/logo.png" alt="WEC Management Logo" style="width: 140px;" />
          </div>

          <div class="title">Reset Your Password</div>
          <hr style="opacity: 0.3; margin: 20px 0;" />

          <div class="message">
              <p>Hello,</p>
              <p>We received a request to <strong>reset your password</strong> for your WEC Management System account.</p>
              <p>You can safely reset your password by clicking the button below:</p>
              <p style="text-align: center;">
                  <a href="${resetLink}" class="button">Reset Password</a>
              </p>
              <p>If you didn’t request this, you can safely ignore this email — your password will remain unchanged.</p>
          </div>

          <div class="footer">
              <p>All rights reserved © ${new Date().getFullYear()} | WEC Management System</p>
              <p>123, Tech Park Avenue, Delhi, India</p>
          </div>
      </div>
  </body>
  
  </html>
  `;

    const subject = "Reset Your Password - WEC Management System";
    return await sendMail({ to: email, subject, html: body });
};



exports.sendOtpForUserSignup = async (data) => {
    const { otp, email } = data;
    console.log("XXXXXXX", otp, email)
    const body = `
  <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your recovery email</title>
    <style>
        body {
            margin: 0 auto;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            border: 1px solid gainsboro;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }

        .logo {
            margin-bottom: 20px;
        }

        .title {
            font-size: 24px;
            color: black;
            font-weight: 500;
            margin-top: 5%;
            margin-bottom: 5%;
        }

        .message {
            font-size: 16px;
            color: #272727;
            margin-bottom: 20px;
            line-height: 1.5;
            text-align: left;
        }

        .code {
            font-size: 36px;
            color: black;
            font-weight: 700;
            margin-bottom: 20px;
            letter-spacing: 2px;
        }

        .note {
            font-size: 14px;
            color: #272727;
            text-align: left;
            margin-top: 20px;
            margin-bottom: 5%;
            line-height: 1.5;
        }

        .footer{
            color: #4a4a4a;
            font-size: 12px;
            max-width: 600px;
            text-align: center;
        }
    </style>
</head>

<body>
    <div style="margin: 0 auto">
        <div class="container">
            <div class="logo">
                <img src="https://localhost:3000/images/logo.avif" style="width: 180px;"
                    alt="Anibhavi Creation">
            </div>
            <div class="title">Verify your Email</div>
            <hr style="opacity: 30%; margin-top: 3%; margin-bottom: 3%;" />
            <div class="message">
                Anibhavi Creation has received a request to verify <strong>${email}</strong>.
                <br><br>
                Use this code to safely verify your email:
            </div>
            <div class="code">${otp}</div>
          <p class="footer">All rights reserved © 2024 | Anibhavi Creation | 18-13-6/80, Rajiv Gandhi Nagar, Dastagirnagar, Chandrayangutta- 500005 Hyderabad, Telangana</p>
        </div>
    </div>
</body>

</html>
  `
    const subject = "Verify your Email";
    return await sendMail({ to: email, subject, html: body });
};

exports.sendResetPassword = async (data) => {
    const { email, token, user } = data;
    // ADMIN_BASE_URL
    console.log("token_data:==", email, token);
    const baseUrl = user === "admin" ? process.env.ADMIN_BASE_URL : process.env.BASE_URL;
    const resetLink = `${baseUrl}/pages/reset-password/${token}`;

    const body = `
    <!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your recovery email</title>
      <style>
          body {
              margin: 0 auto;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
          }
  
          .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #fff;
              border: 1px solid gainsboro;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
          }
  
          .logo {
              margin-bottom: 20px;
          }
  
          .title {
              font-size: 24px;
              color: black;
              font-weight: 500;
              margin-top: 5%;
              margin-bottom: 5%;
          }
  
          .message {
              font-size: 16px;
              color: #272727;
              margin-bottom: 20px;
              line-height: 1.5;
              text-align: left;
          }
  
          .code {
              font-size: 36px;
              color: black;
              font-weight: 700;
              margin-bottom: 20px;
              letter-spacing: 2px;
          }
  
          .note {
              font-size: 14px;
              color: #272727;
              text-align: left;
              margin-top: 20px;
              margin-bottom: 5%;
              line-height: 1.5;
          }
  
          .footer{
              color: #4a4a4a;
              font-size: 12px;
              max-width: 600px;
              text-align: center;
          }
      </style>
  </head>
  
  <body>
      <div style="margin: 0 auto">
          <div class="container">
              <div class="logo">
                  <img src="${prosess.env.BASE_URL}/image/logo.png" style="width: 180px;">
              </div>
              <div class="title">Reset Password</div>
              <hr style="opacity: 30%; margin-top: 3%; margin-bottom: 3%;" />
              <div class="message">
                  Anibhavi Creation received a request to <strong>Change Password</strong>.
                  <br><br>
                  Use this link to safely reset your password: ${resetLink}
              </div>
             <p class="footer">All rights reserved © 2024 | Anibhavi Creation | 18-13-6/80, Rajiv Gandhi Nagar, Dastagirnagar, Chandrayangutta- 500005
              Hyderabad, Telangana</p>
          </div>
      </div>
  </body>
  
  </html>
    `;
    const subject = "Reset your Password";
    return await sendMail({ to: email, subject, html: body });
};

exports.sendEmailByUserForRequastActiveAccount = async ({ email, fullName, mobile }) => {
    // Email to the User
    console.log("User Email:", email);
    const userSubject = "Account Activation Requested";
    const userBody = `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f2f2f2;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #fff;
                border: 1px solid gainsboro;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                text-align: center;
            }
            .title {
                font-size: 24px;
                color: #333;
                margin-bottom: 20px;
            }
            .message {
                font-size: 16px;
                color: #666;
                margin-bottom: 20px;
            }
            .footer {
                font-size: 12px;
                color: #888;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1 class="title">Activation Request Sent</h1>
            <p class="message">Hi ${fullName},</p>
            <p class="message">We have received your request to activate your account. Our team will review your details and activate your account shortly.</p>
            <p class="message">If you have any urgent queries, feel free to reach out to us. </p>
            <p class="message">Contact Number: 8506854624 </p>
            <p class="footer">All rights reserved © 2024 | The Anibhavi Creation</p>
        </div>
    </body>
    </html>`;

    // Email to the Admin
    const adminSubject = "New Account Activation Request";
    const adminBody = `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f9f9f9;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #fff;
                border: 1px solid #ddd;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            h2 {
                color: #333;
                margin-bottom: 20px;
            }
            .info {
                font-size: 16px;
                color: #555;
                margin-bottom: 10px;
            }
            .footer {
                font-size: 12px;
                color: #aaa;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Account Activation Request</h2>
            <p class="info"><strong>Full Name:</strong> ${fullName}</p>
            <p class="info"><strong>Email:</strong> ${email}</p>
            <p class="info"><strong>Mobile:</strong> ${mobile}</p>
            <p class="info">The above user has requested account activation. Please review and activate the account if everything is in order.</p>
            <p class="footer">Admin Portal | The Anibhavi Creation Pvt Ltd</p>
        </div>
    </body>
    </html>`;

    // Send to user
    await sendMail({ to: email, subject: userSubject, html: userBody });

    // Send to admin
    await sendMail({ to: "aasibkhan155471@gmail.com", subject: adminSubject, html: adminBody });

    return true;
};

exports.sendEmailByAdminForRequastActiveAccount = async ({ email, fullName, mobile }) => {
    // Email to the Admin
    console.log("Admin Email:", email);
    const adminSubject = "New Account Activation Request";
    const adminBody = `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f9f9f9;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #fff;
                border: 1px solid #ddd;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            h2 {
                color: #333;
                margin-bottom: 20px;
            }
            .info {
                font-size: 16px;
                color: #555;
                margin-bottom: 10px;
            }
            .footer {
                font-size: 12px;
                color: #aaa;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Account Activation Request</h2>
            <p class="info"><strong>Full Name:</strong> ${fullName}</p>
            <p class="info"><strong>Email:</strong> ${email}</p>
            <p class="info"><strong>Mobile:</strong> ${mobile}</p>
            <p class="info">The above user has requested account activation. Please review and activate the account if everything is in order.</p>
            <p class="footer">Admin Portal | The Anibhavi Creation</p>
        </div>
    </body>
    </html>`;

    // Send to admin
    await sendMail({ to: process.env.ADMIN_EMAIL, subject: adminSubject, html: adminBody });

    return true;
};

exports.sendEmailActiveUserAccount = async ({ email, fullName, isActive }) => {
    console.log(`Sending ${isActive ? 'Activation' : 'Deactivation'} Email To:`, email);

    const subject = isActive
        ? " Your Account is Now Active!"
        : " Your Account Has Been Deactivated";

    const html = `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f9f9f9;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #fff;
                border: 1px solid #ddd;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            h2 {
                color: ${isActive ? '#4CAF50' : '#f44336'};
                margin-bottom: 20px;
            }
            .message {
                font-size: 16px;
                color: #333;
                margin-bottom: 15px;
            }
            .button {
                display: inline-block;
                margin-top: 20px;
                padding: 10px 20px;
                background-color: #4CAF50;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
            }
            .footer {
                font-size: 12px;
                color: #aaa;
                margin-top: 30px;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Hello ${fullName},</h2>
            ${isActive
            ? `<p class="message">Great news! Your account has been <strong>successfully activated</strong> by our admin team. 🎉</p>
                       <p class="message">You can now log in and start using all of our features.</p>
                       <p class="message">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                       <p class="message">Contact Number: 8506854624 </p>`
            : `<p class="message">We regret to inform you that your account has been <strong>deactivated</strong> by our admin team.</p>
                       <p class="message">If you believe this was a mistake or need assistance, please contact our support team.</p>
                       <p class="message">Contact Number: 8506854624 </p>`
        }
            <p class="footer">— The Anibhavi Creation</p>
        </div>
    </body>
    </html>`;

    await sendMail({ to: email, subject, html });
    return true;
};

// exports.sendOrderNotification = async ({ email, name, phone }) => {
//     const subject = "🛒 We Miss You! Come Back and Shop with Us";

//     const html = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//         <style>
//             body {
//                 font-family: Arial, sans-serif;
//                 background-color: #f5f5f5;
//                 margin: 0;
//                 padding: 20px;
//             }
//             .container {
//                 max-width: 600px;
//                 margin: auto;
//                 background-color: #ffffff;
//                 padding: 30px;
//                 border-radius: 10px;
//                 box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
//                 text-align: center;
//             }
//             h2 {
//                 color: #ff6600;
//                 margin-bottom: 20px;
//             }
//             p {
//                 font-size: 16px;
//                 color: #444444;
//                 margin-bottom: 20px;
//             }
//             .btn {
//                 display: inline-block;
//                 padding: 12px 25px;
//                 background-color: #ff6600;
//                 color: #ffffff;
//                 text-decoration: none;
//                 border-radius: 5px;
//                 font-weight: bold;
//             }
//             .footer {
//                 font-size: 12px;
//                 color: #888888;
//                 margin-top: 30px;
//             }
//         </style>
//     </head>
//     <body>
//         <div class="container">
//             <h2>Hey ${name}, We Miss You! 🧡</h2>
//             <p>We noticed you haven’t placed an order in a while. It’s been some time since we’ve seen you, and we’d love to have you back!</p>
//             <p>Explore our new products and exclusive deals crafted just for you.</p>
//             <p class="footer">If you have any questions, feel free to contact us at ${process.env.SUPPORT_PHONE || "our support"}.<br>– YourWebsite Team</p>
//         </div>
//     </body>
//     </html>`;

//     await sendMail({ to: email, subject, html });
// };

exports.sendThankYouEmail = async ({ email, name, phone }) => {
    const subject = "🙏 Thank You for Your Order!";

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: auto;
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
                text-align: center;
            }
            h2 {
                color: #28a745;
                margin-bottom: 20px;
            }
            p {
                font-size: 16px;
                color: #555555;
                margin-bottom: 20px;
            }
            .btn {
                display: inline-block;
                padding: 12px 25px;
                background-color: #28a745;
                color: #ffffff;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
            }
            .footer {
                font-size: 12px;
                color: #999999;
                margin-top: 30px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Thank You, ${name}! 🙌</h2>
            <p>We appreciate your order and the trust you’ve placed in us.</p>
            <p>We’re preparing your package and will notify you once it’s on the way. 🚚</p>
            <a href="https://yourwebsite.com/orders" class="btn">View Your Order</a>
            <p class="footer">Need help? Contact us at ${process.env.SUPPORT_PHONE || "our support team"}<br>– YourWebsite Team</p>
        </div>
    </body>
    </html>`;

    await sendMail({ to: email, subject, html });
};
exports.sendThankYouEmailAdmin = async ({ email, name, phone }) => {
    const subject = "🙏 Thank You for Your Order!";

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: auto;
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
                text-align: center;
            }
            h2 {
                color: #28a745;
                margin-bottom: 20px;
            }
            p {
                font-size: 16px;
                color: #555555;
                margin-bottom: 20px;
            }
            .btn {
                display: inline-block;
                padding: 12px 25px;
                background-color: #28a745;
                color: #ffffff;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
            }
            .footer {
                font-size: 12px;
                color: #999999;
                margin-top: 30px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Thank You, ${name}! 🙌</h2>
            <p>We appreciate your order and the trust you’ve placed in us.</p>
            <p>We’re preparing your package and will notify you once it’s on the way. 🚚</p>
            <a href="https://yourwebsite.com/orders" class="btn">View Your Order</a>
            <p class="footer">Need help? Contact us at ${process.env.SUPPORT_PHONE || "our support team"}<br>– YourWebsite Team</p>
        </div>
    </body>
    </html>`;
    await sendMail({ to: process.env.MAIL_EMAIL_ID, subject, html });
};


exports.sendOrderNotification = async ({ email, name, customer, companySettings, record, termsAndConditions }) => {
    // console.log("XXXXXX::=>", record)
    const rows = record?.amcs?.map((item, index) => `
    <tr>
        <td>${index + 1}</td>
        <td>${item.productCategory} - ${item.productBrand} ${item.productType}</td>
        <td>${item.productModel}</td>
        <td>${item.serialNumber || "N/A"}</td>
        <td>${new Date(item.startDate).toLocaleDateString("en-IN")}</td>
        <td>${new Date(item.endDate).toLocaleDateString("en-IN")}</td>
        <td>₹${item.amcAmount}</td>
    </tr>
`).join("") || "";

    // ✅ Build full styled HTML (use your same template)
    const html = `
<html>
<head>
    <style>
        body { font-family: "Poppins", Arial, sans-serif; padding: 20px; background: #fff; }
        .invoice-box { max-width: 850px; margin: auto; padding: 25px 30px; border: 1px solid #e0e0e0; border-radius: 8px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .company-info h2 { margin: 0; color: #007bff; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background: #007bff; color: white; }
        .invoice-title { text-align: center; margin-top: 15px; font-size: 20px; font-weight: 600; }
        .signature { display: flex; justify-content: center; margin-top: 40px; }
        .sig-line { margin-top: 50px; border-top: 1px solid #000; width: 200px; }
    </style>
</head>
<body>

<div class="invoice-box">
    <div class="header">
        <div>
            <img src="${companySettings?.logo || ''}" style="width:80px;height:80px;object-fit:contain;border-radius:8px;">
            <h2>${companySettings?.name}</h2>
            <p>${companySettings?.address}</p>
            <p>${companySettings?.phone} | ${companySettings?.email}</p>
        </div>
        <div>
            <table>
                <tr><td><strong>WEC No:</strong></td><td>${record?.amcs[0]?.id}</td></tr>
                <tr><td><strong>Date:</strong></td><td>${new Date().toLocaleDateString('en-IN')}</td></tr>
            </table>
        </div>
    </div>

    <div class="invoice-title">Warranty Extended Contract</div>

    <table>
        <tr><th>Customer Name</th><td>${customer.name}</td></tr>
        <tr><th>Address</th><td>${customer.address}</td></tr>
        <tr><th>Contact</th><td>${customer.mobile}</td></tr>
        <tr><th>Email</th><td>${customer.email}</td></tr>
    </table>

    <table>
        <thead>
            <tr><th>#</th><th>Product</th><th>Model</th><th>Serial</th><th>Start</th><th>End</th><th>Amount</th></tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>

     <div class="signature">
        <div>Note:- Under the extended warranty, claims are limited to a maximum of 80% of the product's value (excluding GST).Also please check the attachment what will cover under our Terms & Conditions.</div>
     </div>

      <div class="signature">
        <div >Thank you for choosing EMI PLUS CARE. For support, call us at ‪+91 8929391113‬ or email us at support@emipluscare.in </div>
     </div>
    

    <div style="margin-top:820px;">
        <div style="border:1px solid #ccc;padding:10px;border-radius:4px;">
            ${termsAndConditions || "No terms available."}
        </div>
    </div>

</div>

</body>
</html>
`;


    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfPath = path.join(__dirname, "../uploads", `WEC_${record?.amcs[0]?.id || uuidv4()}.pdf`);
    await page.pdf({ path: pdfPath, format: "A4", printBackground: true });
    await browser.close();

    const downloadLink = `${process.env.serverURL}/uploads/${path.basename(pdfPath)}`;

    // ✅ Send Email
    await sendMail({
        to: email,
        subject: "Warranty Extension Contract – Confirmation & Welcome",

        html: `

<p>Dear <strong>${name}</strong>,</p>

<p>
We are pleased to inform you that your Warranty Extension Contract has been successfully completed and activated. 
Thank you for extending your service support with us. We greatly appreciate your continued trust in our products and services.
</p>

<p>
Please find the Warranty Extension Certificate (WEC) attached for your reference and records. 
Kindly review the document and confirm that the information mentioned is accurate. 
Should any correction be required, please feel free to contact us.
</p>

<p>
We are committed to providing you with reliable technical support and service throughout the warranty period.
</p>

<p><strong>For any inquiry, assistance or technical support, please contact:</strong></p>

<p>
Support Phone: 8929391113, 8929391114, 8929391115, 8929391116 <br>
Support Email: support@emipluscare.in
</p>

<p>
You can also download your contract here:<br>
<a href="${downloadLink}" style="background:#007bff;color:white;padding:5px 11px;border-radius:6px;text-decoration:none;">Download Warranty Contract (PDF)</a>
</p>

<p>
Thank you once again for choosing us. We look forward to serving you.
</p>

<p>
Warm Regards,<br>
<strong>EMI PLUS CARE</strong> <br>
Mail ID: support@emipluscare.in
</p>
`,

        attachments: [{ filename: path.basename(pdfPath), path: pdfPath }]
    });

    return { status: true, message: "✅ Styled PDF Sent Successfully" };
};
