const BigNumber = web3.BigNumber;

const expect = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .expect;

const EVMRevert = require('./helpers/EVMRevert');
const Utils = require("./helpers/Utils");

const PelotonReferrals = artifacts.require("PelotonReferrals");
const Token = artifacts.require("PelotonToken");

const deployReferrals = (tokenAddress, percent) => {
    return PelotonReferrals.new(tokenAddress, percent);
};

const deployToken = () => {
    return Token.new("Peloton Token", "PLTN", 18);
};

contract('PelotonReferrals', function (accounts) {
    const owner = accounts[0];
    const allowed = accounts[1];
    const disallowed = accounts[2];
    const referral = accounts[3];

    const DECIMALS = 18;
    const OVERALL_TOKES = 300000000 * Utils.powerOfTen(DECIMALS);

    beforeEach(async function deployContracts() {
        this.currentTest.token = await deployToken();
        this.currentTest.referrals = await deployReferrals(this.currentTest.token.address, 1);
        await this.currentTest.referrals.allowAddress(allowed, true);
        await this.currentTest.token.setUnlocked(this.currentTest.referrals.address, true);
        await this.currentTest.token.approve(this.currentTest.referrals.address, OVERALL_TOKES);
    });

    it("REFERRALS_1 - setPercent() - Check that owner can set referral percent", async function () {
        await this.test.referrals.setPercent(2, {from: owner});
        let res = await this.test.referrals.referralPercent.call();

        await expect(res.toString()).to.be.equal('2');
    });

    it("REFERRALS_2 - setPercent() - Check that only owner can set referral percent", async function () {
        await expect(this.test.referrals.setPercent(2, {from: disallowed})).to.be.eventually.rejectedWith(EVMRevert);
    });

    it("REFERRALS_3 - update() - Check that allowed address can update referrals", async function () {
        await this.test.referrals.setPercent(1, {from: owner});
        await this.test.referrals.update(referral, 10000, {from: allowed});

        let res = await this.test.referrals.referralTokens.call(referral);

        await expect(res.toString()).to.be.equal('100');
    });

    it("REFERRALS_4 - update() - Check that only allowed address can update referrals", async function () {
        await this.test.referrals.setPercent(1, {from: owner});
        await expect(this.test.referrals.update(referral, 10000, {from: disallowed})).to.be.eventually.rejectedWith(EVMRevert);
    });

    it("REFERRALS_5 - claim() - Check that user can claim referral tokens", async function () {
        await this.test.referrals.setPercent(1, {from: owner});
        await this.test.referrals.update(referral, 10000, {from: allowed});

        await this.test.referrals.claim({from: referral});

        let balance = await this.test.token.balanceOf.call(referral);
        let referralTokens = await this.test.referrals.referralTokens.call(referral);

        await expect(balance.toString()).to.be.equal('100');
        await expect(referralTokens.toString()).to.be.equal('0');
    });

});