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

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Governance Token
        GovernanceToken token = new GovernanceToken();
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

        vm.stopBroadcast();

        // Save addresses to file
        string memory output = string.concat(
            "VITE_GOVERNANCE_TOKEN=", vm.toString(address(token)), "\n",
            "VITE_JUROR_REGISTRY=", vm.toString(address(registry)), "\n",
            "VITE_GOVERNOR=", vm.toString(address(governor)), "\n"
        );
    }
}
