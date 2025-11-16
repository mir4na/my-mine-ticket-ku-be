// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/WIDR.sol";
import "../src/TicketNFT.sol";
import "../src/EventEscrow.sol";

contract EventEscrowTest is Test {
    WIDR public wIDR;
    TicketNFT public ticketNFT;
    EventEscrow public escrow;
    
    address public owner;
    address public taxRecipient;
    address public platformRecipient;
    address public buyer;
    address public receiver1;
    address public receiver2;
    
    function setUp() public {
        owner = address(this);
        taxRecipient = address(0x1);
        platformRecipient = address(0x2);
        buyer = address(0x3);
        receiver1 = address(0x4);
        receiver2 = address(0x5);
        
        wIDR = new WIDR();
        ticketNFT = new TicketNFT();
        escrow = new EventEscrow(
            address(wIDR),
            address(ticketNFT),
            taxRecipient,
            platformRecipient
        );
        
        ticketNFT.transferOwnership(address(escrow));
    }
    
    function testCreateEvent() public {
        address[] memory receivers = new address[](2);
        receivers[0] = receiver1;
        receivers[1] = receiver2;
        
        uint256[] memory percentages = new uint256[](2);
        percentages[0] = 6000;
        percentages[1] = 4000;
        
        escrow.createEvent("event-1", receivers, percentages);
        
        (address[] memory returnedReceivers, uint256[] memory returnedPercentages) = 
            escrow.getEventReceivers("event-1");
        
        assertEq(returnedReceivers.length, 2);
        assertEq(returnedReceivers[0], receiver1);
        assertEq(returnedPercentages[0], 6000);
    }
    
    function testPurchaseTicket() public {
        address[] memory receivers = new address[](2);
        receivers[0] = receiver1;
        receivers[1] = receiver2;
        
        uint256[] memory percentages = new uint256[](2);
        percentages[0] = 6000;
        percentages[1] = 4000;
        
        escrow.createEvent("event-1", receivers, percentages);
        
        uint256 ticketPrice = 100 ether;
        wIDR.mint(owner, ticketPrice);
        wIDR.approve(address(escrow), ticketPrice);
        
        uint256 nftTokenId = escrow.purchaseTicket(
            "event-1",
            buyer,
            ticketPrice,
            "ipfs://metadata"
        );
        
        assertGt(nftTokenId, 0);
        
        uint256 taxAmount = (ticketPrice * 10) / 100;
        uint256 platformFee = (ticketPrice * 250) / 10000;
        
        assertEq(wIDR.balanceOf(taxRecipient), taxAmount);
        assertEq(wIDR.balanceOf(platformRecipient), platformFee);
    }
    
    function testCompleteEventAndWithdraw() public {
        address[] memory receivers = new address[](2);
        receivers[0] = receiver1;
        receivers[1] = receiver2;
        
        uint256[] memory percentages = new uint256[](2);
        percentages[0] = 6000;
        percentages[1] = 4000;
        
        escrow.createEvent("event-1", receivers, percentages);
        
        uint256 ticketPrice = 100 ether;
        wIDR.mint(owner, ticketPrice);
        wIDR.approve(address(escrow), ticketPrice);
        
        escrow.purchaseTicket("event-1", buyer, ticketPrice, "ipfs://metadata");
        
        escrow.completeEvent("event-1");
        
        (uint256 balance1, bool withdrawn1) = escrow.getReceiverBalance("event-1", receiver1);
        assertGt(balance1, 0);
        assertFalse(withdrawn1);
        
        address custodialWallet = address(0x999);
        vm.prank(receiver1);
        escrow.withdraw("event-1", custodialWallet);
        
        assertGt(wIDR.balanceOf(custodialWallet), 0);
        
        (, bool withdrawn1After) = escrow.getReceiverBalance("event-1", receiver1);
        assertTrue(withdrawn1After);
    }
    
    function testCannotPurchaseAfterEventCompleted() public {
        address[] memory receivers = new address[](1);
        receivers[0] = receiver1;
        
        uint256[] memory percentages = new uint256[](1);
        percentages[0] = 10000;
        
        escrow.createEvent("event-1", receivers, percentages);
        escrow.completeEvent("event-1");
        
        uint256 ticketPrice = 100 ether;
        wIDR.mint(owner, ticketPrice);
        wIDR.approve(address(escrow), ticketPrice);
        
        vm.expectRevert("Event already completed");
        escrow.purchaseTicket("event-1", buyer, ticketPrice, "ipfs://metadata");
    }
    
    function testClaimNFT() public {
        address[] memory receivers = new address[](1);
        receivers[0] = receiver1;
        
        uint256[] memory percentages = new uint256[](1);
        percentages[0] = 10000;
        
        escrow.createEvent("event-1", receivers, percentages);
        
        uint256 ticketPrice = 100 ether;
        wIDR.mint(owner, ticketPrice);
        wIDR.approve(address(escrow), ticketPrice);
        
        uint256 nftTokenId = escrow.purchaseTicket(
            "event-1",
            buyer,
            ticketPrice,
            "ipfs://metadata"
        );
        
        address vaultAddress = address(ticketNFT);
        assertEq(ticketNFT.ownerOf(nftTokenId), vaultAddress);
        
        escrow.claimTicketNFT(nftTokenId, buyer);
        
        assertEq(ticketNFT.ownerOf(nftTokenId), buyer);
        assertTrue(ticketNFT.claimed(nftTokenId));
    }
}