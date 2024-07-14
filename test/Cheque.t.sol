// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Cheque.sol";

contract ChequeTest is Test {
    Cheque public cheque;
    IERC20 public usdcToken;
    address public owner;
    uint256 public ownerPk;
    address public user;
    uint256 public userPk;
    uint256 public initialBalance = 1000 * 10**6;

    function setUp() public {
        usdcToken = new MockERC20("USD Coin", "USDC", 6);

        (address _owner, uint256 _ownerPk) = makeAddrAndKey("OWNER");
        (address _user, uint256 _userPk) = makeAddrAndKey("USER");
        owner = _owner;
        ownerPk = _ownerPk;
        user = _user;
        userPk = _userPk;

        MockERC20(address(usdcToken)).mint(owner, initialBalance);
        MockERC20(address(usdcToken)).mint(user, initialBalance);

        cheque = new Cheque(address(usdcToken));
    }

    function testLockUSDC() public {
        vm.startPrank(user);

        uint256 amount = 100 * 10**6;

        usdcToken.approve(address(cheque), amount);

        cheque.lockUSDC(amount);

        assertEq(usdcToken.balanceOf(address(cheque)), amount);

        assertEq(cheque.lockedUSDC(user), amount);

        vm.stopPrank();
    }

    function testClaim() public {
        vm.startPrank(user);

        uint256 amount = 100 * 10**6;

        usdcToken.approve(address(cheque), amount);

        cheque.lockUSDC(amount);

        // Generate a signature
        bytes32 messageHash = keccak256(abi.encodePacked(amount));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPk, ethSignedMessageHash);

        bytes memory signature = abi.encodePacked(r, s, v);

        vm.stopPrank();

        vm.startPrank(owner);

        cheque.claim(amount, signature);

        assertEq(usdcToken.balanceOf(owner), initialBalance + amount);

        assertEq(cheque.lockedUSDC(user), 0);

        vm.stopPrank();
    }
}

contract MockERC20 is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    function transfer(address recipient, uint256 amount) external returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        _transfer(sender, recipient, amount);
        uint256 currentAllowance = allowance[sender][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        allowance[sender][msg.sender] = currentAllowance - amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function mint(address account, uint256 amount) public {
        totalSupply += amount;
        balanceOf[account] += amount;
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        uint256 senderBalance = balanceOf[sender];
        require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");
        balanceOf[sender] = senderBalance - amount;
        balanceOf[recipient] += amount;
    }
}
