const express = require("express");
const paseto = require("paseto");
const cors = require("cors");
const { V3 } = paseto;
const { Client, TokenId, AccountBalanceQuery } = require("@hashgraph/sdk");
const createToken = require("./createToken");

const app = express();
const port = 5000;

V3.generateKey("local", { format: "paserk" }).then((key) => {
  privateKey = key;
  console.log(key);
});
const htsTokenId = "0.0.3910131"; // Replace with your HTS Token ID
console.log("ht", htsTokenId);
const hederaClient = new Client({ network: "testnet" }); // Use 'mainnet' for production

app.use(cors());
app.use(express.json());

// Endpoint to generate PASETO token
app.post("/generate-token", async (req, res) => {
  const { accountId } = req.body;
  const payload = { sub: accountId, exp: Math.floor(Date.now() / 1000) + 3600 }; // 1 hour expiry
  const footer = "access-rights";
  const token = await V3.encrypt({ payload, footer }, privateKey);

  res.json({ token });
});

// Middleware to verify PASETO token
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payloadRes = await paseto.V3.decrypt(token, privateKey, {
      footer: "access-rights",
    });
    req.accountId = payloadRes.payload.sub;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

app.get("/verify-token", verifyToken, async (req, res) => {
  const accountId = req.accountId;
  const balance = await new AccountBalanceQuery()
    .setAccountId(accountId)
    .execute(hederaClient);
  const tokenBalance = balance.tokens.get(
    TokenId.fromString((await htsTokenId).toString())
  );
  if (tokenBalance && tokenBalance.toNumber() >= 1) {
    res.json({
      is_valid: true,
    });
  } else {
    res.status(403).json({ message: "Insufficient HTS balance", is_valid:false });
  }
});

// Endpoint to access protected content
app.get("/protected-content", verifyToken, async (req, res) => {
  const accountId = req.accountId;
  const balance = await new AccountBalanceQuery()
    .setAccountId(accountId)
    .execute(hederaClient);
  const tokenBalance = balance.tokens.get(
    TokenId.fromString((await htsTokenId).toString())
  );
  if (tokenBalance && tokenBalance.toNumber() >= 1) {
    res.json({
      content: {
        video: "https://www.youtube.com/embed/inWWhr5tnEA",
        image:
          "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8aHVtYW58ZW58MHx8MHx8&w=1000&q=80",
        text: "Nature Loving",
      },
    });
  } else {
    res.status(403).json({ message: "Insufficient HTS balance" });
  }
});

app.listen(port | 5000, () => {
  console.log("Listening on port " + port);
});
