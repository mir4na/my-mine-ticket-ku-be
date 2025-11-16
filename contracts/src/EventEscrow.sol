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

    uint256 public constant TAX_PERCENTAGE = 10;
    uint256 public constant PLATFORM_FEE = 250;
    uint256 public constant PERCENTAGE_DENOMINATOR = 10000;

    address public taxRecipient;
    address public platformRecipient;

    event TicketPurchased(string indexed eventId, address indexed buyer, uint256 amount, uint256 nftTokenId);
    event RevenueDistributed(string indexed eventId, address indexed receiver, uint256 amount);
    event Withdrawn(string indexed eventId, address indexed receiver, uint256 amount);
    event EventCompleted(string indexed eventId);

    constructor(
        address _wIDRToken,
        address _ticketNFT,
        address _taxRecipient,
        address _platformRecipient
    ) Ownable(msg.sender) {
        wIDRToken = WIDR(_wIDRToken);
        ticketNFT = TicketNFT(_ticketNFT);
        taxRecipient = _taxRecipient;
        platformRecipient = _platformRecipient;
    }

    function createEvent(
        string memory eventId,
        address[] memory receivers,
        uint256[] memory percentages
    ) external onlyOwner {
        require(receivers.length == percentages.length, "Length mismatch");
        require(events[eventId].receivers.length == 0, "Event already exists");

        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < percentages.length; i++) {
            totalPercentage += percentages[i];
        }
        require(totalPercentage == PERCENTAGE_DENOMINATOR, "Invalid percentage distribution");

        events[eventId] = EventData({
            eventId: eventId,
            receivers: receivers,
            percentages: percentages,
            isCompleted: false,
            totalEscrow: 0
        });
    }

    function purchaseTicket(
        string memory eventId,
        address buyer,
        uint256 amount,
        string memory nftMetadataURI
    ) external onlyOwner nonReentrant returns (uint256) {
        require(events[eventId].receivers.length > 0, "Event does not exist");
        require(!events[eventId].isCompleted, "Event already completed");

        require(
            wIDRToken.transferFrom(msg.sender, address(this), amount),
            "wIDR transfer failed"
        );

        uint256 taxAmount = (amount * TAX_PERCENTAGE) / 100;
        uint256 platformFeeAmount = (amount * PLATFORM_FEE) / PERCENTAGE_DENOMINATOR;
        uint256 netAmount = amount - taxAmount - platformFeeAmount;

        require(wIDRToken.transfer(taxRecipient, taxAmount), "Tax transfer failed");
        require(wIDRToken.transfer(platformRecipient, platformFeeAmount), "Platform fee transfer failed");

        eventEscrowBalance[eventId] += netAmount;
        events[eventId].totalEscrow += netAmount;

        uint256 nftTokenId = ticketNFT.mintToVault(nftMetadataURI);

        emit TicketPurchased(eventId, buyer, amount, nftTokenId);
        return nftTokenId;
    }

    function completeEvent(string memory eventId) external onlyOwner {
        require(events[eventId].receivers.length > 0, "Event does not exist");
        require(!events[eventId].isCompleted, "Event already completed");

        EventData storage eventData = events[eventId];
        uint256 totalAmount = eventEscrowBalance[eventId];

        for (uint256 i = 0; i < eventData.receivers.length; i++) {
            address receiver = eventData.receivers[i];
            uint256 percentage = eventData.percentages[i];
            uint256 receiverAmount = (totalAmount * percentage) / PERCENTAGE_DENOMINATOR;

            receiverBalances[eventId][receiver].balance = receiverAmount;

            emit RevenueDistributed(eventId, receiver, receiverAmount);
        }

        eventData.isCompleted = true;
        emit EventCompleted(eventId);
    }

    function withdraw(string memory eventId, address custodialWallet) external nonReentrant {
        require(events[eventId].isCompleted, "Event not completed");

        ReceiverBalance storage rb = receiverBalances[eventId][msg.sender];
        require(rb.balance > 0, "No balance to withdraw");
        require(!rb.withdrawn, "Already withdrawn");

        uint256 amount = rb.balance;

        rb.withdrawn = true;
        eventEscrowBalance[eventId] -= amount;

        require(wIDRToken.transfer(custodialWallet, amount), "Withdrawal failed");

        emit Withdrawn(eventId, msg.sender, amount);
    }

    function claimTicketNFT(uint256 tokenId, address claimer) external onlyOwner {
        ticketNFT.claimNFT(tokenId, claimer);
    }

    function updateTaxRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        taxRecipient = newRecipient;
    }

    function updatePlatformRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        platformRecipient = newRecipient;
    }

    function getEventReceivers(string memory eventId) external view returns (address[] memory, uint256[] memory) {
        return (events[eventId].receivers, events[eventId].percentages);
    }

    function getReceiverBalance(string memory eventId, address receiver) external view returns (uint256, bool) {
        ReceiverBalance memory rb = receiverBalances[eventId][receiver];
        return (rb.balance, rb.withdrawn);
    }
}
