const twilio = require("twilio");

exports.sendWhatsApp = async (to, message, { throwOnError = false } = {}) => {
  if (!to) return;
  try {
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_WHATSAPP_NUMBER
    ) {
      throw new Error("WhatsApp notification credentials are not configured");
    }
    const normalizedNumber = String(to).replace(/[\s().-]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedNumber)) {
      throw new Error("WhatsApp recipient number must use international E.164 format");
    }
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${normalizedNumber}`,
      body: message,
    });
  } catch (error) {
    console.error("WhatsApp notification failed:", error.message);
    if (throwOnError) throw error;
  }
};
