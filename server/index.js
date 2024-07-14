const crypto = require("crypto");
const express = require("express");
const axios = require("axios");
const forge = require("node-forge");
const { v4: uuidv4 } = require("uuid");
const Redis = require("ioredis");
const {
  parseUnits,
  encodeFunctionData,
  parseAbi,
  maxUint256,
} = require("viem");
require("dotenv").config();

const app = express();
const port = 3000;

const CIRCLE_KEY = "https://api.circle.com/v1/w3s";

const getChequeContract = (chain) => {
  switch (chain) {
    case "sepolia":
      return "0xa8684d7c5450A8eBf9DD6a9B21b810908Ec2EDD3";

    default:
      return "0xa8684d7c5450A8eBf9DD6a9B21b810908Ec2EDD3";
  }
};

const getUSDCContract = (chain) => {
  switch (chain) {
    case "sepolia":
      return "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

    default:
      return "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
  }
};

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
      // accountType: "SCA",
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
  const amount = parseUnits(req.params.amount, 6);

  const client = new Redis(
    `rediss://default:${process.env.REDIS_SECRET}@solid-whale-50202.upstash.io:6379`,
  );
  const walletMeta = JSON.parse(await client.get(userId));
  client.disconnect();

  // TODO: make a message that contains the amount (when the smart contract is done)
  const message = `I authorize a claim of ${amount.toString()} USDC`;

  const signature = await axios.post(
    `${CIRCLE_KEY}/developer/sign/message`,
    {
      walletId: walletMeta.id,
      entitySecretCipherText: getCipherText(),
      message: amount.toString(),
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

app.get("/lockUSDC/:userId/:amount", async (req, res) => {
  console.log("signing cheque...");
  const userId = req.params.userId;
  const amount = parseUnits(req.params.amount, 6);

  const client = new Redis(
    `rediss://default:${process.env.REDIS_SECRET}@solid-whale-50202.upstash.io:6379`,
  );
  const walletMeta = JSON.parse(await client.get(userId));
  client.disconnect();

  const callData = encodeFunctionData({
    abi: parseAbi(["function lockUSDC(uint256 amount) external"]),
    functionName: "lockUSDC",
    args: [amount],
  });

  // const estimate = await axios.post(
  //   `${CIRCLE_KEY}/transactions/contractExecution/estimateFee`,
  //   {
  //     contractAddress: getChequeContract("sepolia"),
  //     callData,
  //     walletId: walletMeta.id,
  //   },
  //   {
  //     headers: {
  //       Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
  //     },
  //   },
  // );
  // console.log(estimate.data);

  const ret = await axios.post(
    `${CIRCLE_KEY}/developer/transactions/contractExecution`,
    {
      idempotencyKey: uuidv4(),
      entitySecretCipherText: getCipherText(),
      contractAddress: getChequeContract("sepolia"),
      callData,
      walletId: walletMeta.id,
      feeLevel: "HIGH",
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
      },
    },
  );

  console.log(ret.data);

  res.json({
    message: "USDC deposited",
  });
});

app.get("/approve/:userId", async (req, res) => {
  console.log("approve...");
  const userId = req.params.userId;

  const client = new Redis(
    `rediss://default:${process.env.REDIS_SECRET}@solid-whale-50202.upstash.io:6379`,
  );
  const walletMeta = JSON.parse(await client.get(userId));
  client.disconnect();

  const callData = encodeFunctionData({
    abi: parseAbi([
      "function approve(address spender, uint256 amount) external",
    ]),
    functionName: "approve",
    args: [getChequeContract("sepolia"), maxUint256],
  });

  const ret = await axios.post(
    `${CIRCLE_KEY}/developer/transactions/contractExecution`,
    {
      idempotencyKey: uuidv4(),
      entitySecretCipherText: getCipherText(),
      contractAddress: getUSDCContract("sepolia"),
      callData,
      walletId: walletMeta.id,
      feeLevel: "MEDIUM",
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
      },
    },
  );

  console.log(ret.data);

  res.json({
    message: "USDC deposited",
  });
});

app.get("/getInfo/:userId", async (req, res) => {
  const userId = req.params.userId;

  const client = new Redis(
    `rediss://default:${process.env.REDIS_SECRET}@solid-whale-50202.upstash.io:6379`,
  );
  const walletMeta = JSON.parse(await client.get(userId));
  client.disconnect();

  const ret = await axios.get(`${CIRCLE_KEY}/wallets/${walletMeta.id}`, {
    headers: {
      Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
    },
  });

  const balances = await axios.get(
    `${CIRCLE_KEY}/wallets/${walletMeta.id}/balances?tokenAddress=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`,
    {
      headers: {
        Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
      },
    },
  );

  console.log(ret.data);
  console.log(balances.data.data);
  const address = ret.data.data.wallet.address;

  res.json({
    address,
    balance: balances.data.data.tokenBalances[0].amount,
  });
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
