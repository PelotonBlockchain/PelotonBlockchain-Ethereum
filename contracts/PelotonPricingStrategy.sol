pragma solidity ^0.4.23;

import "./interfaces/PricingStrategyInterface.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

contract PelotonPricingStrategy is PricingStrategyInterface, Pausable {

    function calculatePrice(uint256 _value, uint256 _decimals) whenNotPaused public constant returns (uint256) {
        uint256 multiplier = 10 ** _decimals;
        uint256 weiAmount = _value.mul(multiplier);

        uint256 resultTokenInWei = oneTokenInWei;
        if (discount > 0) {
            uint256 resultPricePercent = 100 - discount;
            resultTokenInWei = oneTokenInWei.mul(resultPricePercent).div(100);
        }

        require(resultTokenInWei > 0);

        uint256 tokens = weiAmount.div(resultTokenInWei);

        return tokens;
    }

    function setTokenPriceInWei(uint256 _oneTokenInWei) onlyAllowedAddresses whenNotPaused public returns (bool) {
        oneTokenInWei = _oneTokenInWei;
        emit TokenPriceInWeiUpdated(msg.sender, oneTokenInWei);
        return true;
    }

    function setTokenDiscount(uint256 _discountPercents) onlyAllowedAddresses whenNotPaused public returns (bool) {
        // discount can not be more than 100%
        require(_discountPercents <= 100);

        discount = _discountPercents;
        emit TokenDiscountUpdated(msg.sender, _discountPercents);
        return true;
    }
}