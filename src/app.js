const { 
  default: makeWASocket, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion 
} = require("@whiskeysockets/baileys");

const P = require("pino");
const qrcode = require("qrcode-terminal");

async function startBot() {

  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const { version } = await fetchLatestBaileysVersion();
  const { Boom } = require("@hapi/boom");
  const { DisconnectReason } = require("@whiskeysockets/baileys");
  const { isDev } = require("./env");

  if (isDev) {
    console.log("🧪 DEV MODE");
  } else {
    console.log("🚀 PROD MODE");
  }

  const sock = makeWASocket({
    auth: state,
    version,
    logger: P({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

sock.ev.on("connection.update", async (update) => {
  const { connection, qr, lastDisconnect } = update;

  if (qr) {
    console.log("📱 Scan QR ini:");
    qrcode.generate(qr, { small: true });
  }

  if (connection === "open") {
    console.log("✅ Connected To WhatsApp!");
    if (isDev) {
      console.log("🧪 CLI MODE");

      const readline = require("readline");

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      function ask() {
        rl.question("No: ", (number) => {
          rl.question("Message: ", async (message) => {

            await sock.sendMessage(`${number}@s.whatsapp.net`, {
              text: message
            });

            console.log("✅ Sent");
            ask();
          });
        });
      }

      ask();

    } else {
      // PROD
      await sock.sendMessage("6281298504866@s.whatsapp.net", {
        text: "SELAMAT DATANG DI PODCAST HORROR"
      });
    }
  }
  

  if (connection === "close") {
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

    console.log("❌ Connection closed, reason:", reason);

    if (reason !== DisconnectReason.loggedOut) {
      console.log("🔄 Reconnecting...");
      startBot();
    } else {
      console.log("🚫 Logged out, scan ulang QR");
    }
  }
});

sock.ev.on("messages.upsert", async (m) => {
  const msg = m.messages[0];

  if (!msg.message) return;

  const from = msg.key.remoteJid;

  const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    msg.message.imageMessage?.caption ||
    msg.message.videoMessage?.caption;

  console.log("📩 From:", from);
  console.log("💬 Message", text);
});

}

startBot();