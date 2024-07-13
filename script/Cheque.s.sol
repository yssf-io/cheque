// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Cheque} from "../src/Cheque.sol";

contract ChequeScript is Script {
    Cheque public cheque;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        address SEPOLIA_USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;

        cheque = new Cheque(SEPOLIA_USDC);

        vm.stopBroadcast();
    }
}
