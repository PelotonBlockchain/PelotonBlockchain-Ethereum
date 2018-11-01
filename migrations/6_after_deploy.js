var PelotonCrowdsale = artifacts.require("./PelotonCrowdsale.sol");
var PelotonToken = artifacts.require("./PelotonToken.sol");
var PelotonPricingStrategy = artifacts.require("./PelotonPricingStrategy.sol");
var PelotonReferrals = artifacts.require("./PelotonReferrals.sol");

var mainnet_token = '';
var mainnet_pricing_strategy = '';
var mainnet_crowdsale = '';
var mainnet_referrals = '';

var DEBUG = true;

function powerOfTen(exp) {
    parseInt(exp);
    if (exp === 0) {
        return 1;
    } else if (exp > 0) {
        let result = 1;
        for (let i = 0; i < exp; i++) {
            result = result * 10;
        }
        return result;
    } else {
        return 0;
    }
}

// TODO: Can be different for prod
var OVERALL_TOKENS = 300000000 * powerOfTen(18);

// TODO: Can be different for prod
// 0.25 ETH
var ONE_TOKEN_PRICE_WEI = 250000000000000000;

module.exports = function(deployer) {
    deployer
        .then(() => {
            return DEBUG ? PelotonToken.deployed() : PelotonToken.at(mainnet_token);
        })
        .then((token) => {
            return DEBUG ? token.approve(PelotonCrowdsale.address, OVERALL_TOKENS) : token.approve(mainnet_crowdsale, OVERALL_TOKENS);
        })
        .then(() => {
            return DEBUG ? PelotonToken.deployed() : PelotonToken.at(mainnet_token);
        })
        .then((token) => {
            return DEBUG ? token.approve(PelotonReferrals.address, OVERALL_TOKENS) : token.approve(mainnet_referrals, OVERALL_TOKENS);
        })
        .then(() => {
            return DEBUG ? PelotonPricingStrategy.deployed() : PelotonPricingStrategy.at(mainnet_pricing_strategy);
        })
        .then((pricing) => {
            return DEBUG ? pricing.allowAddress(PelotonCrowdsale.address, true) : pricing.allowAddress(mainnet_crowdsale, true);
        })
        .then(() => {
            return DEBUG ? PelotonPricingStrategy.deployed() : PelotonPricingStrategy.at(mainnet_pricing_strategy);
        })
        .then((pricing) => {
            return pricing.setTokenPriceInWei(ONE_TOKEN_PRICE_WEI);
        })
        .then(() => {
            return DEBUG ? PelotonToken.deployed() : PelotonToken.at(mainnet_token);
        })
        .then((token) => {
            return DEBUG ? token.setUnlocked(PelotonCrowdsale.address, true) : token.setUnlocked(mainnet_crowdsale, true);
        })
        .then(() => {
            return DEBUG ? PelotonToken.deployed() : PelotonToken.at(mainnet_token);
        })
        .then((token) => {
            return DEBUG ? token.setUnlocked(PelotonReferrals.address, true) : token.setUnlocked(mainnet_referrals, true);
        })
};