// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/GovernanceToken.sol";
import "../contracts/JurorRegistry.sol";
import "../contracts/GovernorSortition.sol";

contract DeployScript is Script {
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address pythEntropy = vm.envAddress("PYTH_ENTROPY");
        address pythProvider = vm.envAddress("PYTH_PROVIDER");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Governance Token
        GovernanceToken token = new GovernanceToken();
        console.log("========================================");
        console.log("GovernanceToken deployed at:", address(token));

        // 2. Deploy Juror Registry
        JurorRegistry registry = new JurorRegistry(address(token));
        console.log("JurorRegistry deployed at:", address(registry));

        // 3. Deploy Governor Sortition
        GovernorSortition governor = new GovernorSortition(
            pythEntropy,
            pythProvider,
            address(registry)
        );
        console.log("GovernorSortition deployed at:", address(governor));
        console.log("========================================");

        vm.stopBroadcast();

        // Print .env format
        console.log("\nAdd these to your .env file:");
        console.log("VITE_GOVERNANCE_TOKEN=%s", address(token));
        console.log("VITE_JUROR_REGISTRY=%s", address(registry));
        console.log("VITE_GOVERNOR=%s", address(governor));
    }
}
