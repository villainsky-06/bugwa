import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from "@whiskeysockets/baileys"
import express from "express"
import P from "pino"

const app = express()
app.use(express.json())

let sock

async function startWhatsapp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info")
  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    version,
    browser: ["Ubuntu", "Firefox", "20.0.00"],
    generateHighQualityLinkPreview: true,
    syncFullHistory: true
  })

  sock.ev.on("creds.update", saveCreds)
  sock.ev.on("connection.update", ({ connection }) => {
    if (connection === "open") console.log("✅ WhatsApp Connected")
    if (connection === "close") console.log("❌ WhatsApp Disconnected")
  })
}

app.post("/send", async (req, res) => {
  const { number, message } = req.body
  if (!sock) return res.status(500).send({ error: "WhatsApp belum connect" })
  try {
    const jid = number.replace(/\D/g, "") + "@s.whatsapp.net"
    await sock.sendMessage(jid, { text: message })
    res.send({ success: true })
  } catch (err) {
    res.status(500).send({ error: err.message })
  }
})

app.listen(3000, () => {
  console.log("🚀 API jalan di http://localhost:3000")
  startWhatsapp()
})