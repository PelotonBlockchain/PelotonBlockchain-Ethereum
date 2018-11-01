var PelotonCrowdsale = artifacts.require("./PelotonCrowdsale.sol");
var PelotonToken = artifacts.require("./PelotonToken.sol");
var PelotonPricingStrategy = artifacts.require("./PelotonPricingStrategy.sol");
var PelotonReferrals = artifacts.require("./PelotonReferrals.sol");

var mainnet_token = '';

// TODO: Replace by real mainnet wallet
var mainnet_wallet = '0x9c756a55d31e1a0a16012ac696e4d367e532fe76';

var mainnet_pricing_strategy = '';
var mainnet_crowdsale = '';
var mainnet_referrals = '';

var signer = '0x396C8E5cc1fF356BcEC75FFD9a733127498fE45f';

var DEBUG = true;

module.exports = function(deployer) {
    deployer.deploy(PelotonCrowdsale,
        DEBUG ? PelotonToken.address : mainnet_token,
        mainnet_wallet,
        DEBUG ? PelotonPricingStrategy.address : mainnet_pricing_strategy,
        signer,
        DEBUG ? PelotonReferrals.address : mainnet_referrals
    );
};