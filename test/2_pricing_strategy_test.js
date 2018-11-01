const BigNumber = web3.BigNumber;

const expect = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .expect;

const EVMRevert = require('./helpers/EVMRevert');
const Utils = require("./helpers/Utils");

const PelotonPricingStrategy = artifacts.require("PelotonPricingStrategy");

const deployPricingStrategy = () => {
    return PelotonPricingStrategy.new();
};

contract('PelotonPricingStrategy', function (accounts) {
    const owner = accounts[0];
    const allowed = accounts[1];
    const disallowed = accounts[2];

    const decimals = 18;

    beforeEach(async function deployContracts() {
        this.currentTest.pricing = await deployPricingStrategy();
        await this.currentTest.pricing.allowAddress(allowed, true);
    });

    it("PRICING_STRATEGY_1 - setTokenPriceInWei() - Check that allowed address can set token price", async function () {
        const price = 1000;

        await this.test.pricing.setTokenPriceInWei(price, {from: allowed});
        const res = await this.test.pricing.oneTokenInWei.call();

        await expect(parseInt(res.valueOf())).to.be.equal(price);
    });

    it("PRICING_STRATEGY_2 - setTokenPriceInWei() - Check that not allowed address can not set token price", async function () {
        const price = 1000;
        await expect(this.test.pricing.setTokenPriceInWei(price, {from: disallowed})).to.eventually.be.rejectedWith(EVMRevert);
    });

    it("PRICING_STRATEGY_3 - calculateTokenAmount() - Check that tokens calculated correctly", async function () {
        const price = 1000;
        const wei = 10000;

        await this.test.pricing.setTokenPriceInWei(price, {from: allowed});
        const res = await this.test.pricing.calculatePrice.call(wei, decimals);

        const jsRes = new BigNumber(wei / price).mul(new BigNumber("1e18"));
        await expect(new BigNumber(res.valueOf()).toString()).to.be.equal(jsRes.toString());
    });

    it("PRICING_STRATEGY_4", async function () {
        console.log("\tCovered by PRICING_STRATEGY_3");
    });

    it("PRICING_STRATEGY_5", async function () {
        console.log("\tCovered by PRICING_STRATEGY_3");
    });

    it("PRICING_STRATEGY_6 - pause() - Check that functions can not be called until pause", async function () {
        const price = 1000;

        await this.test.pricing.pause();
        await expect(this.test.pricing.setTokenPriceInWei(price, {from: allowed})).to.eventually.be.rejectedWith(EVMRevert);
    });

    it("PRICING_STRATEGY_7 - unpause() - Check that functions can be unpaused", async function () {
        const price = 1000;

        await this.test.pricing.pause();
        await this.test.pricing.unpause();
        await this.test.pricing.setTokenPriceInWei(price, {from: allowed});
    });

});