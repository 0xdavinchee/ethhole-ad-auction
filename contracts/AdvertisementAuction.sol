//SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "hardhat/console.sol";

contract AdvertisementAuction {
    string public advertText;
    string public advertImageUrlText;
    uint256 public currentBid;
    address private owner;

    constructor(address payable _owner) {
        owner = _owner;
    }

    function setTexts(
        string memory _advertText,
        string memory _advertImageUrlText
    ) external payable {
        require(msg.value > currentBid);

        currentBid = msg.value;
        advertText = _advertText;
        advertImageUrlText = _advertImageUrlText;
    }

    receive() external payable {}
}
