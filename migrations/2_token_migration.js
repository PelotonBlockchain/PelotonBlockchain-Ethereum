var PelotonToken = artifacts.require("./PelotonToken.sol");

module.exports = function(deployer) {
    deployer.deploy(PelotonToken, "Peloton Token", "PLTN", 18);
};