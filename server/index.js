const crypto = require("crypto");
const express = require("express");
const axios = require("axios");
const forge = require("node-forge");
const { v4: uuidv4 } = require("uuid");
const Redis = require("ioredis");
require("dotenv").config();

const app = express();
const port = 3000;

const CIRCLE_KEY = "https://api.circle.com/v1/w3s";

const getCipherText = () => {
  const secret = process.env.SECRET;

  const entitySecret = forge.util.hexToBytes(secret);

  const publicKeyCircle = process.env.PUBLIC_KEY;

  const publicKey = forge.pki.publicKeyFromPem(publicKeyCircle);

  const encryptedData = publicKey.encrypt(entitySecret, "RSA-OAEP", {
    md: forge.md.sha256.create(),
    mgf1: { md: forge.md.sha256.create() },
  });

  return forge.util.encode64(encryptedData);
};

app.get("/", async (req, res) => {
  res.json({
    message: "hello, nothing to see here...",
  });
});

app.get("/createWalletSet/:name", async (req, res) => {
  console.log("creating a wallet set...");
  const name = req.params.name;

  const walletSet = await axios.post(
    `${CIRCLE_KEY}/developer/walletSets`,
    {
      idempotencyKey: uuidv4(),
      entitySecretCipherText: getCipherText(),
      name,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
      },
    },
  );

  console.log(walletSet.data.data.walletSet.id);

  const client = new Redis(
    `rediss://default:${process.env.REDIS_SECRET}@solid-whale-50202.upstash.io:6379`,
  );
  await client.set(name, walletSet.data.data.walletSet.id);
  client.disconnect();

  res.json({
    name,
    id: walletSet.data.data.walletSet.id,
  });
});

app.get("/generateWallet/:userId", async (req, res) => {
  console.log("generating wallet...");
  const userId = req.params.userId;

  const wallet = await axios.post(
    `${CIRCLE_KEY}/developer/wallets`,
    {
      idempotencyKey: uuidv4(),
      entitySecretCipherText: getCipherText(),
      blockchains: ["ETH-SEPOLIA"],
      count: 1,
      walletSetId: "0190ab49-56d6-7c26-829c-be54ccccbfe7", // we could use the id stored in redis, but we're just gonna use this one for the mvp
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
      },
    },
  );

  const { id, walletSetId, address, blockchain, accountType } =
    wallet.data.data.wallets[0];
  const walletMeta = { id, walletSetId, address, blockchain, accountType };

  const client = new Redis(
    `rediss://default:${process.env.REDIS_SECRET}@solid-whale-50202.upstash.io:6379`,
  );
  await client.set(userId, JSON.stringify(walletMeta, null, 2));
  client.disconnect();

  res.json({
    message: "wallet created",
    ...walletMeta,
  });
});

app.get("/signCheque/:userId/:amount", async (req, res) => {
  console.log("signing cheque...");
  const userId = req.params.userId;
  const amount = req.params.amount;

  const client = new Redis(
    `rediss://default:${process.env.REDIS_SECRET}@solid-whale-50202.upstash.io:6379`,
  );
  const walletMeta = JSON.parse(await client.get(userId));
  client.disconnect();

  // TODO: make a message that contains the amount (when the smart contract is done)
  const message = "signing this message hello";

  const signature = await axios.post(
    `${CIRCLE_KEY}/developer/sign/message`,
    {
      walletId: walletMeta.id,
      entitySecretCipherText: getCipherText(),
      message,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
      },
    },
  );

  res.json({
    message,
    signature: signature.data.data.signature,
  });
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
