const { ethers } = require("hardhat");

const FACTORY = "0x4e59b44847b379578588920cA78FbF26c0B4956C";
const SALT = ethers.keccak256(ethers.toUtf8Bytes("Nous.v1"));

async function main() {
  const Synapse = await ethers.getContractFactory("Nous");
  const initCode = Synapse.bytecode;
  const initCodeHash = ethers.keccak256(initCode);

  const packed = ethers.solidityPacked(
    ["bytes1", "address", "bytes32", "bytes32"],
    ["0xff", FACTORY, SALT, initCodeHash]
  );
  const hash = ethers.keccak256(packed);
  const address = ethers.getAddress("0x" + hash.slice(26));

  console.log("Salt:          ", SALT);
  console.log("InitCodeHash:  ", initCodeHash);
  console.log("Predicted addr:", address);
  console.log("Deploy calldata (to factory):", SALT.slice(2) + initCode.slice(2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
