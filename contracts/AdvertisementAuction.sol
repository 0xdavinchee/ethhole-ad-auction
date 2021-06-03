//SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "hardhat/console.sol";

contract AdvertisementAuction {
    address private owner;
    string public advertText;
    string public advertImageUrlText;
    address public lastBidder;
    uint256 public lastBid;
    uint256 public lastBidAt;
    uint256 public id;

    event CreateAdvertisement(
        uint256 indexed id,
        address indexed creator,
        string text,
        string urlText,
        uint256 bidAmount,
        uint256 lastBidAt
    );

    event Withdrawal(uint256 amount);

    constructor(address payable _owner) {
        owner = _owner;
        lastBidAt = block.timestamp;
    }

    function setTexts(
        string memory _advertText,
        string memory _advertImageUrlText
    ) external payable {
        require(
            msg.value > lastBid,
            "Your bid must be higher than the last bid."
        );

        lastBid = msg.value;
        advertText = _advertText;
        advertImageUrlText = _advertImageUrlText;
        lastBidAt = block.timestamp;
        lastBidder = msg.sender;
        id = id + 1;

        emit CreateAdvertisement(
            id,
            msg.sender,
            _advertText,
            _advertImageUrlText,
            msg.value,
            block.timestamp
        );
    }

    function withdrawFunds() external payable {
        require(msg.sender == owner, "You are not the owner.");
        require(address(this).balance > 0, "There is nothing to withdraw.");
        uint256 balance = address(this).balance;
        (bool sent, bytes memory data) = owner.call{value: balance}("");
        require(sent, "Failed to withdraw.");
        emit Withdrawal(balance);
    }

    receive() external payable {}
}
