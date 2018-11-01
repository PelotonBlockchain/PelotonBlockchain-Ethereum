pragma solidity ^0.4.0;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./interfaces/AllowedAddresses.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

contract PelotonReferrals is AllowedAddresses {
    using SafeMath for uint256;

    DetailedERC20 public token;
    uint256 public referralPercent;
    mapping(address => uint256) public referralTokens;

    event ReferralPercentChanged(address _from, uint256 _prev, uint256 _curr);
    event ReceivedReferralTokens(address _referralAddress, uint256 _amount, uint256 _overallTokens);
    event ReferralTokensClaimed(address _referralAddress, uint256 _amount);

    function PelotonReferrals(DetailedERC20 _token, uint256 _referralPercent) {
        token = _token;
        referralPercent = _referralPercent;
    }

    function update(address _referralAddress, uint256 _tokensBought) public onlyAllowedAddresses {
        uint256 tokensForReferral = _tokensBought.div(100).mul(referralPercent);
        referralTokens[_referralAddress] = referralTokens[_referralAddress].add(tokensForReferral);
        emit ReceivedReferralTokens(_referralAddress, tokensForReferral, referralTokens[_referralAddress]);
    }

    function claim() public {
        token.transferFrom(owner, msg.sender, referralTokens[msg.sender]);
        referralTokens[msg.sender] = 0;
        emit ReferralTokensClaimed(msg.sender, referralTokens[msg.sender]);
    }

    function setPercent(uint256 _percent) external onlyOwner {
        require(_percent >= 0);
        emit ReferralPercentChanged(msg.sender, referralPercent, _percent);

        referralPercent = _percent;
    }
}
