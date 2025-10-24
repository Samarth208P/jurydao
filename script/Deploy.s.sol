// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/GovernanceToken.sol";
import "../contracts/JurorRegistry.sol";
import "../contracts/GovernorSortition.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address pythEntropy = vm.envAddress("PYTH_ENTROPY");
        address pythProvider = vm.envAddress("PYTH_PROVIDER");

        vm.startBroadcast(deployerPrivateKey);

        console.log("=== JuryDAO Deployment ===");
        console.log("Network: Base Sepolia");
        console.log("Deployer:", vm.addr(deployerPrivateKey));

        // 1. Deploy GovernanceToken
        console.log("\n[1/3] Deploying GovernanceToken...");
        GovernanceToken token = new GovernanceToken();
        console.log("   Token:", address(token));

        // 2. Deploy JurorRegistry
        console.log("\n[2/3] Deploying JurorRegistry...");
        JurorRegistry registry = new JurorRegistry(address(token));
        console.log("   Registry:", address(registry));

        // 3. Deploy GovernorSortition
        console.log("\n[3/3] Deploying GovernorSortition...");
        GovernorSortition governor = new GovernorSortition(
            pythEntropy,
            pythProvider,
            address(registry)
        );
        console.log("   Governor:", address(governor));

        vm.stopBroadcast();

        // Print update instructions
        console.log("\n=== DEPLOYMENT COMPLETE ===\n");
        console.log("Update your .env file with these addresses:\n");
        console.log("VITE_GOVERNANCE_TOKEN=%s", address(token));
        console.log("VITE_JUROR_REGISTRY=%s", address(registry));
        console.log("VITE_GOVERNOR_SORTITION=%s", address(governor));

        // Print verification commands
        console.log("\n=== VERIFICATION COMMANDS ===\n");
        console.log("# Verify GovernanceToken");
        console.log("forge verify-contract %s \\", address(token));
        console.log("  contracts/GovernanceToken.sol:GovernanceToken \\");
        console.log("  --chain-id 84532 \\");
        console.log("  --etherscan-api-key $ETHERSCAN_API_KEY\n");

        console.log("# Verify JurorRegistry");
        console.log("forge verify-contract %s \\", address(registry));
        console.log("  contracts/JurorRegistry.sol:JurorRegistry \\");
        console.log("  --chain-id 84532 \\");
        console.log("  --constructor-args $(cast abi-encode \"constructor(address)\" %s) \\", address(token));
        console.log("  --etherscan-api-key $ETHERSCAN_API_KEY\n");

        console.log("# Verify GovernorSortition");
        console.log("forge verify-contract %s \\", address(governor));
        console.log("  contracts/GovernorSortition.sol:GovernorSortition \\");
        console.log("  --chain-id 84532 \\");
        console.log("  --constructor-args $(cast abi-encode \"constructor(address,address,address)\" %s %s %s) \\", pythEntropy, pythProvider, address(registry));
        console.log("  --etherscan-api-key $ETHERSCAN_API_KEY");
    }
}
