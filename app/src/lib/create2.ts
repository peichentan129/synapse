import { getContractAddress, keccak256, toHex, concatHex, type Hex } from "viem";
import { NOUS_BYTECODE } from "../abi/nous";

// Standard "deterministic deployment proxy" (Nick's method) — same address on
// every EVM chain, confirmed live on BotChain. No constructor args on Nous,
// so this address is a pure function of (factory, salt, bytecode).
export const CREATE2_FACTORY: Hex = "0x4e59b44847b379578588920cA78FbF26c0B4956C";

export const NOUS_SALT: Hex = keccak256(toHex("Nous.v1"));

export const NOUS_ADDRESS = getContractAddress({
  from: CREATE2_FACTORY,
  opcode: "CREATE2",
  salt: NOUS_SALT,
  bytecode: NOUS_BYTECODE,
});

export const DEPLOY_CALLDATA: Hex = concatHex([NOUS_SALT, NOUS_BYTECODE]);
