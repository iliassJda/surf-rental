import fs from "fs";
import path from "path";

const contractName = "SurfRental";
const sourcePath = path.resolve(
	__dirname,
	`../artifacts/contracts/${contractName}.sol/${contractName}.json`
);
const destPath = path.resolve(`./abi/${contractName}.json`);

fs.copyFileSync(sourcePath, destPath);
console.log(`✅ Copied ${contractName} ABI to frontend`);
