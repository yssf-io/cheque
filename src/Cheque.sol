// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

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
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        address signer = recoverSigner(ethSignedMessageHash, signature);

        require(lockedUSDC[signer] > 0, "Invalid signature");
        require(lockedUSDC[signer] >= amount, "Insufficient balance");
        require(signer != msg.sender, "Signer cannot claim their tokens back");

        lockedUSDC[signer] -= amount;

        require(usdcToken.transfer(msg.sender, amount), "Transfer failed");
    }

    function getMessageHash(uint256 amount) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("I authorize a claim of ", amount, " USDC"));
    }

    function getEthSignedMessageHash(bytes32 messageHash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
    }

    function recoverSigner(bytes32 ethSignedMessageHash, bytes memory signature) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}
