import express from "express";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { nodeClient, gasStationClient } from "../config/sponsor-config";
import { buildGaslessTransactionBytes } from "@shinami/clients";
import axios from "axios";

const router = express.Router();

const getTransactionBlock = (transactionBody: any, txb: any) => {
  const xArguments = transactionBody.arguments;
  const convertedArguments = <any>[];
  xArguments.forEach((argument: { type: string; value: any }) => {
    argument.type === "object"
      ? convertedArguments.push(txb.object(argument.value))
      : convertedArguments.push(txb.pure(argument.value));
  });
  return convertedArguments;
};

router.post("/request_sponsored_response", async (req, res) => {
  try {
    const transactionBody = req.body.transactionBody;
    const senderAddress = req.body.senderAddress;
    console.log({ transactionBody, senderAddress });

    const gaslessPayloadBase64 = await buildGaslessTransactionBytes({
      sui: nodeClient,
      build: async (txb) => {
        const transactionContent = getTransactionBlock(transactionBody, txb);
        console.log({ transactionContent });
        txb.moveCall({
          target: transactionBody.target,
          arguments: transactionContent,
        });
      },
    });

    const GAS_BUDGET = 100000000;

    const sponsoredResponse = await gasStationClient.sponsorTransactionBlock(
      gaslessPayloadBase64,
      senderAddress,
      GAS_BUDGET
    );

    console.log({ sponsoredResponse });

    return res.status(200).json(sponsoredResponse);
  } catch (err) {
    console.log({ err });
    return res
      .status(500)
      .json("Something went wrong during initializing sponsored transaction");
  }
});

router.post("/send_sponsored_transaction", async (req, res) => {
  try {
    const txBytes = req.body.txBytes;
    const userSignature = req.body.userSignature;
    const responseSignature = req.body.responseSignature;

    const executeResponse = await nodeClient.executeTransactionBlock({
      transactionBlock: txBytes,
      signature: [userSignature, responseSignature],
      options: { showEffects: true },
      requestType: "WaitForLocalExecution",
    });

    return res.status(200).json({
      status: executeResponse.effects?.status.status,
    });
  } catch (err) {
    return res
      .status(500)
      .json("Something went wrong during sending sponsored transaction");
  }
});

router.get("/get_sui_price", async (req, res) => {
  try {
    const result = await axios.get(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=20947`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": "4e3fcaec-c886-49e0-8969-0713d46a1bfa",
        },
      }
    );
    return res
      .status(200)
      .json({ price: result.data.data["20947"].quote["USD"].price });
  } catch (err) {
    return res
      .status(500)
      .json("Something went wrong during fetching sui price");
  }
});

export default router;
