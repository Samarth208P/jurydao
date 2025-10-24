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

        // Fund the governor contract for Entropy fees
        console.log("\n[4/4] Funding Governor contract...");
        (bool success,) = address(governor).call{value: 0.01 ether}("");
        require(success, "Failed to fund governor");
        console.log("   Funded with 0.01 ETH");

        vm.stopBroadcast();

        // Print update instructions
        console.log("\n=== DEPLOYMENT COMPLETE ===\n");
        console.log("Update your frontend .env with:\n");
        console.log("VITE_GOVERNANCE_TOKEN=%s", address(token));
        console.log("VITE_JUROR_REGISTRY=%s", address(registry));
        console.log("VITE_GOVERNOR_SORTITION=%s", address(governor));
    }
}
