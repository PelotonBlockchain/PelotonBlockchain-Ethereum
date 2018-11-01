var PelotonPricingStrategy = artifacts.require("./PelotonPricingStrategy.sol");

module.exports = function(deployer) {
    deployer.deploy(PelotonPricingStrategy);
};