// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract Cheque {
    IERC20 public usdcToken;
    mapping(address => uint256) public lockedUSDC;

    constructor(address _usdcToken) {
        usdcToken = IERC20(_usdcToken);
    }

    function lockUSDC(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "transferFrom failed");

        lockedUSDC[msg.sender] += amount;
    }

    function claim(uint256 amount, bytes memory signature) external {
        // Verifying the signature
        bytes32 messageHash = getMessageHash(amount);
        address signer = _getSigner(signature, messageHash);

        require(lockedUSDC[signer] > 0, "Invalid signature");
        require(lockedUSDC[signer] >= amount, "Insufficient balance");
        require(signer != msg.sender, "Signer cannot claim their tokens back");

        lockedUSDC[signer] -= amount;

        require(usdcToken.transfer(msg.sender, amount), "Transfer failed");
    }


    function _getSigner(bytes memory signature, bytes32 msgHash) internal view returns (address) {
        return ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(msgHash), signature);
    }

    function getMessageHash(uint256 amount) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(amount));
    }
}
