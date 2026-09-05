import { getContractAddress, keccak256, toHex, concatHex, type Hex } from "viem";
import { SYNAPSE_BYTECODE } from "../abi/synapse";

// Standard "deterministic deployment proxy" (Nick's method) — same address on
// every EVM chain, confirmed live on BotChain. No constructor args on Synapse,
// so this address is a pure function of (factory, salt, bytecode).
export const CREATE2_FACTORY: Hex = "0x4e59b44847b379578588920cA78FbF26c0B4956C";

export const SYNAPSE_SALT: Hex = keccak256(toHex("Synapse.v1"));

export const SYNAPSE_ADDRESS = getContractAddress({
  from: CREATE2_FACTORY,
  opcode: "CREATE2",
  salt: SYNAPSE_SALT,
  bytecode: SYNAPSE_BYTECODE,
});

export const DEPLOY_CALLDATA: Hex = concatHex([SYNAPSE_SALT, SYNAPSE_BYTECODE]);
