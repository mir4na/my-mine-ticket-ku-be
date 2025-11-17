// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./WIDR.sol";
import "./TicketNFT.sol";

contract EventEscrow is ReentrancyGuard, Ownable {
    WIDR public wIDRToken;
    TicketNFT public ticketNFT;

    struct EventData {
        string eventId;
        address[] receivers;
        uint256[] percentages;
        bool isCompleted;
        uint256 totalEscrow;
    }

    struct ReceiverBalance {
        uint256 balance;
        bool withdrawn;
    }

    mapping(string => EventData) public events;
    mapping(string => mapping(address => ReceiverBalance)) public receiverBalances;
    mapping(string => uint256) public eventEscrowBalance;

    uint256 public constant PERCENTAGE_DENOMINATOR = 10000;

    event TicketPurchased(string indexed eventId, address indexed buyer, uint256 amount, uint256 nftTokenId);
    event RevenueDistributed(string indexed eventId, address indexed receiver, uint256 amount);
    event Withdrawn(string indexed eventId, address indexed receiver, uint256 amount);
    event EventCompleted(string indexed eventId);

    constructor(address _wIDRToken, address _ticketNFT) Ownable(msg.sender) {
        wIDRToken = WIDR(_wIDRToken);
        ticketNFT = TicketNFT(_ticketNFT);
    }

    function createEvent(
        string memory eventId,
        address[] memory receivers,
        uint256[] memory percentages
    ) external onlyOwner {
        require(receivers.length == percentages.length, "Length mismatch");
        require(events[eventId].receivers.length == 0, "Event exists");

        uint256 total = 0;
        for (uint256 i = 0; i < percentages.length; i++) {
            total += percentages[i];
        }
        require(total == PERCENTAGE_DENOMINATOR, "Bad percentage");

        events[eventId] = EventData(eventId, receivers, percentages, false, 0);
    }

    function purchaseTicket(
        string memory eventId,
        address buyer,
        uint256 amount,
        string memory metadataURI
    ) external onlyOwner nonReentrant returns (uint256) {
        require(events[eventId].receivers.length > 0, "Event missing");
        require(!events[eventId].isCompleted, "Event already completed");

        require(wIDRToken.transferFrom(msg.sender, address(this), amount), "Transfer fail");

        eventEscrowBalance[eventId] += amount;
        events[eventId].totalEscrow += amount;

        uint256 tokenId = ticketNFT.mintToVault(metadataURI);
        emit TicketPurchased(eventId, buyer, amount, tokenId);
        return tokenId;
    }

    function completeEvent(string memory eventId) external onlyOwner {
        EventData storage eventData = events[eventId];

        require(eventData.receivers.length > 0, "Event missing");
        require(!eventData.isCompleted, "Done");

        uint256 total = eventEscrowBalance[eventId];

        for (uint256 i = 0; i < eventData.receivers.length; i++) {
            address recv = eventData.receivers[i];
            uint256 pct = eventData.percentages[i];

            uint256 share = (total * pct) / PERCENTAGE_DENOMINATOR;
            receiverBalances[eventId][recv].balance = share;

            emit RevenueDistributed(eventId, recv, share);
        }

        eventData.isCompleted = true;
        emit EventCompleted(eventId);
    }

    function withdraw(string memory eventId, address wallet) external nonReentrant {
        ReceiverBalance storage bal = receiverBalances[eventId][msg.sender];

        require(events[eventId].isCompleted, "Not done");
        require(bal.balance > 0, "Zero bal");
        require(!bal.withdrawn, "Already took");

        uint256 amount = bal.balance;
        bal.withdrawn = true;
        eventEscrowBalance[eventId] -= amount;

        require(wIDRToken.transfer(wallet, amount), "Transfer fail");
        emit Withdrawn(eventId, msg.sender, amount);
    }

    function claimTicketNFT(uint256 tokenId, address claimer) external onlyOwner {
        ticketNFT.claimNFT(tokenId, claimer);
    }

    function getEventReceivers(string memory eventId) external view returns (address[] memory, uint256[] memory) {
        EventData storage eventData = events[eventId];
        return (eventData.receivers, eventData.percentages);
    }

    function getReceiverBalance(string memory eventId, address receiver) external view returns (uint256, bool) {
        ReceiverBalance storage bal = receiverBalances[eventId][receiver];
        return (bal.balance, bal.withdrawn);
    }
}