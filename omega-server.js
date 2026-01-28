import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 7000;

let clients = [];

app.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients.push(res);
  req.on("close", () => {
    clients = clients.filter(c => c !== res);
  });
});

function broadcast(data) {
  clients.forEach(c => c.write(`data: ${JSON.stringify(data)}\n\n`));
}

async function pollPi(network="testnet") {
  const API = network==="mainnet"
    ? "https://api.mainnet.minepi.com"
    : "https://api.testnet.minepi.com";

  try {
    const r = await fetch(`${API}/ledgers?order=desc&limit=1`);
    const j = await r.json();
    const ledger = j._embedded.records[0];

    const anomaly = ledger.operation_count > 1000;
    broadcast({
      time: new Date().toISOString(),
      ledger: ledger.sequence,
      ops: ledger.operation_count,
      anomaly
    });
  } catch(e){}
}

setInterval(()=>pollPi("testnet"),3000);

app.listen(PORT,()=>console.log("🧠 OMEGA Server live on",PORT));
