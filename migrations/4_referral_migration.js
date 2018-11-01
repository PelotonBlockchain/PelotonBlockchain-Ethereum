var PelotonToken = artifacts.require("./PelotonToken.sol");
var PelotonReferrals = artifacts.require("./PelotonReferrals.sol");

var referral_percent = 1;

module.exports = function(deployer) {
    deployer.deploy(PelotonReferrals, PelotonToken.address, referral_percent);
};