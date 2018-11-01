pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./AllowedAddresses.sol";


contract PricingStrategyInterface is AllowedAddresses {
    using SafeMath for uint256;

    /* How many weis one token costs */
    uint256 public oneTokenInWei;
    /* Current discount in percents */
    uint256 public discount;


    event TokenPriceInWeiUpdated(address _updatedFrom, uint256 _oneTokenInWei);
    event TokenDiscountUpdated(address _updatedFrom, uint256 _discount);

    function isPricingStrategy() public pure returns (bool) {
        return true;
    }

    /**
      @notice Calculate tokens amount for ether sent according to oneTokenInWei value
      @param _value Count of ether sent.
      @param _decimals Decimals of the token
     */
    function calculatePrice(uint256 _value, uint256 _decimals) public view returns (uint256);

    /**
      @notice Update token price in wei
      @param _oneTokenInWei New price
     */
    function setTokenPriceInWei(uint256 _oneTokenInWei) public returns (bool);

    /**
      @notice Update current discount percentage
      @param _discountPercents New discount in percents
    */
    function setTokenDiscount(uint256 _discountPercents) public returns (bool);
}
