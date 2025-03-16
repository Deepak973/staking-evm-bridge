// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {StakingBridge} from "../src/StakingBridge.sol";
import {StakingBridgeProxy} from "../src/StakingBridgeProxy.sol";
import {StakingBridgeProxyAdmin} from "../src/StakingBridgeProxyAdmin.sol";

contract DeployStakingBridge is Script {
    StakingBridge public implementation;
    StakingBridgeProxy public proxy;
    StakingBridgeProxyAdmin public proxyAdmin;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address ccipRouter = vm.envAddress("CCIP_ROUTER_ADDRESS");
        address deployer = vm.addr(deployerPrivateKey);  // Get deployer address
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy implementation
        implementation = new StakingBridge();

        // Deploy ProxyAdmin with deployer as owner
        proxyAdmin = new StakingBridgeProxyAdmin(deployer);  // Using explicit deployer address

        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            StakingBridge.initialize.selector,
            treasury,
            ccipRouter
          
        );

        // Deploy Proxy
        proxy = new StakingBridgeProxy(
            address(implementation),
            address(proxyAdmin),
            initData
        );

        vm.stopBroadcast();

        console.log("Implementation deployed to:", address(implementation));
        console.log("ProxyAdmin deployed to:", address(proxyAdmin));
        console.log("Proxy deployed to:", address(proxy));
    }
} 