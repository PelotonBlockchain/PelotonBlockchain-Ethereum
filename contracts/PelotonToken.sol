pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "./interfaces/LockableToken.sol";

contract PelotonToken is LockableToken, DetailedERC20 {
    uint256 public totalSupply;

    event Converted(address _from, uint256 _amount);

    constructor(string _name, string _symbol, uint8 _decimals) DetailedERC20(_name, _symbol, _decimals) public{
        totalSupply = 300000000 * (10 ** uint256(decimals));
        owner = msg.sender;

        // TODO: how many wallets must be created on deploying?
        balances[owner] = totalSupply;
    }

    function burningConvert(uint256 _amount) public {
        require(balances[msg.sender] >= _amount);
        balances[msg.sender] = balances[msg.sender].sub(_amount);

        emit Converted(msg.sender, _amount);
    }
}