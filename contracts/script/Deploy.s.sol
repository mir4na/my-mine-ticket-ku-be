// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/WIDR.sol";
import "../src/TicketNFT.sol";
import "../src/EventEscrow.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        WIDR wIDR = new WIDR();
        console.log("WIDR deployed at:", address(wIDR));

        TicketNFT ticketNFT = new TicketNFT();
        console.log("TicketNFT deployed at:", address(ticketNFT));

        EventEscrow escrow = new EventEscrow(
            address(wIDR),
            address(ticketNFT)
        );
        console.log("EventEscrow deployed at:", address(escrow));

        ticketNFT.transferOwnership(address(escrow));
        console.log("TicketNFT ownership transferred to EventEscrow");

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("WIDR:", address(wIDR));
        console.log("TicketNFT:", address(ticketNFT));
        console.log("EventEscrow:", address(escrow));
    }
}