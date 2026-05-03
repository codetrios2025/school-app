const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

exports.sendWhatsApp = async (to, message) => {
  try {
    if (!to) return;

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`, // e.g. +919999999999
      body: message,
    });
  } catch (err) {
    console.log("WhatsApp Error:", err.message);
  }
};
