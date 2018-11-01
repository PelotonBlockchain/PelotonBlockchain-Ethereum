pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

contract LockableToken is PausableToken {
    mapping (address => bool) public unlocked;
    bool public isAllUnlocked = false;

    modifier onlyUnlocked() {
        require(msg.sender == owner || unlocked[msg.sender] == true || isAllUnlocked);
        _;
    }

    function transfer(
        address _to,
        uint256 _value
    )
    public
    whenNotPaused
    onlyUnlocked
    returns (bool)
    {
        return super.transfer(_to, _value);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    )
    public
    whenNotPaused
    onlyUnlocked
    returns (bool)
    {
        return super.transferFrom(_from, _to, _value);
    }

    function unlock() onlyOwner {
        isAllUnlocked = true;
    }

    function lock() onlyOwner {
        isAllUnlocked = false;
    }

    function setUnlocked(address _addr, bool _locked) onlyOwner {
        unlocked[_addr] = _locked;
    }
}
