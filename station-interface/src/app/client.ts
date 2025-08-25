import { createThirdwebClient, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";

// Replace this with your client ID string
// refer to https://portal.thirdweb.com/typescript/v5/client on how to get a client ID
const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;

if (!clientId) {
  throw new Error("No client ID provided");
}

export const client = createThirdwebClient({
  clientId: clientId,
});

// Define the chain (update this with your actual chain configuration)
export const chain = defineChain({
  id: 1329, // SEI testnet chain ID, update if different
  rpc: "https://evm-rpc-testnet.sei-apis.com",
});

// Contract configuration
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

export const contract = getContract({
  client,
  chain,
  address: CONTRACT_ADDRESS,
});
