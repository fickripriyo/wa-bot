const express = require("express");
const app = express();

app.use(express.json());

let sock; 

function setSocket(s) {
  sock = s;
}

app.post("/send-message", async (req, res) => {
  try {
    const { phone, message } = req.body;

    await sock.sendMessage(`${phone}@s.whatsapp.net`, {
      text: message
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { app, setSocket };