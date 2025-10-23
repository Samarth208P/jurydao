// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract JurorRegistry {
    IERC20 public token;
    address[] public jurorList;
    mapping(address => bool) private jurors;

    event JurorRegistered(address indexed juror, uint256 amount);

    constructor(address _token) {
        token = IERC20(_token);
    }

    function registerJuror(uint256 amount) external {
        require(amount >= 100 * 10**18, "Minimum 100 tokens required");
        require(!jurors[msg.sender], "Already registered");

        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        jurors[msg.sender] = true;
        jurorList.push(msg.sender);

        emit JurorRegistered(msg.sender, amount);
    }

    function isJuror(address account) external view returns (bool) {
        return jurors[account];
    }

    function getJurorCount() external view returns (uint256) {
        return jurorList.length;
    }

    function getJurorAtIndex(uint256 index) external view returns (address) {
        require(index < jurorList.length, "Index out of bounds");
        return jurorList[index];
    }
}
