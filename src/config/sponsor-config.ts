import { accessKey } from "./";
import { SuiClient } from "@mysten/sui.js/client";
import { rpcClient } from "typed-rpc";
import { GasStationClient, createSuiClient } from "@shinami/clients";

interface SponsoredTransaction {
  txBytes: string;
  txDigest: string;
  signature: string;
  expireAtTime: number;
  expireAfterEpoch: number;
}
type SponsoredTransactionStatus = "IN_FLIGHT" | "COMPLETE" | "INVALID";

interface SponsorRpc {
  gas_sponsorTransactionBlock(
    txBytes: string,
    sender: string,
    gasBudget: number
  ): SponsoredTransaction;
  gas_getSponsoredTransactionBlockStatus(
    txDigest: string
  ): SponsoredTransactionStatus;
}

const nodeClient = createSuiClient(accessKey);
const gasStationClient = new GasStationClient(accessKey);

const SPONSOR_RPC_URL = `https://api.shinami.com/gas/v1/${accessKey}`;

const suiProvider = new SuiClient({ url: SPONSOR_RPC_URL });

const sponsor = rpcClient<SponsorRpc>(SPONSOR_RPC_URL);

export {
  SponsoredTransaction,
  SponsoredTransactionStatus,
  SponsorRpc,
  SPONSOR_RPC_URL,
  suiProvider,
  sponsor,
  nodeClient,
  gasStationClient,
};
