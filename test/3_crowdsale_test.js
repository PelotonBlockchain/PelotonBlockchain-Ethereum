const BigNumber = web3.BigNumber;

const expect = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .expect;

const EVMRevert = require('./helpers/EVMRevert');
const Utils = require('./helpers/Utils');

const Token = artifacts.require("PelotonToken");
const PricingStrategy = artifacts.require("PelotonPricingStrategy");
const Crowdsale = artifacts.require("PelotonCrowdsale");
const PelotonReferrals = artifacts.require("PelotonReferrals");

const Signer = require('./helpers/Signer.js');

const deployToken = () => {
    return Token.new("Peloton Token", "PLTN", 18);
};

const deployPricingStrategy = () => {
    return PricingStrategy.new();
};

const deployCrowdsale = (tokenAddress, pricingStrategyAddress, walletAddress, verifierAddress, referralsAddress) => {
    return Crowdsale.new(tokenAddress, walletAddress, pricingStrategyAddress, verifierAddress, referralsAddress);
};

const deployReferrals = (tokenAddress, percent) => {
    return PelotonReferrals.new(tokenAddress, percent);
};

const signer = new Signer('default');

contract('PelotonCrowdsale', function (accounts) {
    const owner = accounts[0];
    const allowed = accounts[1];
    const user = accounts[2];
    const verifier = '0x396C8E5cc1fF356BcEC75FFD9a733127498fE45f';
    const verifier_pk = '0x7804B2AD10B7EF7200678B2EA42C78B4A66DF5FB264A4867C38C859DD5DA38DC';
    const referral = accounts[4];

    const ONE_TOKEN_PRICE_WEI = 100;
    const DECIMALS = 18;
    const OVERALL_TOKES = 300000000 * Utils.powerOfTen(DECIMALS);

    const uuid = "caed2abe-9efd-45f8-958d-9e0001cac37e";
    const hexUuid = "0xcaed2abe9efd45f8958d9e0001cac37e";

    beforeEach(async function deployContracts() {
        this.currentTest.token = await deployToken();
        this.currentTest.pricingStrategy = await deployPricingStrategy();
        this.currentTest.referrals = await deployReferrals(this.currentTest.token.address, 1);
        this.currentTest.crowdsale = await deployCrowdsale(
            this.currentTest.token.address,
            this.currentTest.pricingStrategy.address,
            owner,
            verifier,
            this.currentTest.referrals.address
        );
        await this.currentTest.token.approve(this.currentTest.crowdsale.address, OVERALL_TOKES);
        await this.currentTest.token.setUnlocked(this.currentTest.crowdsale.address, true);
        await this.currentTest.pricingStrategy.allowAddress(this.currentTest.crowdsale.address, true);
        await this.currentTest.pricingStrategy.setTokenPriceInWei(ONE_TOKEN_PRICE_WEI);
        await this.currentTest.crowdsale.allowAddress(allowed, true);
        await this.currentTest.referrals.allowAddress(this.currentTest.crowdsale.address, true);
        await this.currentTest.token.setUnlocked(this.currentTest.referrals.address, true);
        await this.currentTest.token.approve(this.currentTest.referrals.address, OVERALL_TOKES);

        this.currentTest.sign = await signer.signInvestParams(uuid, referral, verifier_pk);
    });

    it("CROWDSALE_1 - getStageInfo() - Check current stage params receiving", async function () {
        const res = await this.test.crowdsale.getStageInfo.call(Utils.Status.Unknown.id);
        await expect(res[0].toString()).to.be.equal('0');
        await expect(res[1].toString()).to.be.equal('0');
        await expect(res[2].toString()).to.be.equal('0');
        await expect(res[3].toString()).to.be.equal('0');
        await expect(res[3].toString()).to.be.equal('0');
    });

    it("CROWDSALE_2 - nextStage() - Check that allowed address can iterate through stages", async function () {
        // move to next stage
        await this.test.crowdsale.nextStage({from: allowed});

        // receive current ico status
        let currentStatus = parseInt((await this.test.crowdsale.currentStatus.call()).valueOf());

        // check that status have been changed
        await expect(currentStatus).to.be.equal(Utils.Status.ST1.id);

        // get new stage info
        let stageInfo = await this.test.crowdsale.getStageInfo.call(currentStatus);

        // check that discount is right
        await expect(stageInfo[0].toString()).to.be.equal(Utils.Status.ST1.discount.toString());

        // check that maxTokens is right
        await expect(stageInfo[1].toString()).to.be.equal(Utils.Status.withDecimals(Utils.Status.ST1.maxTokens).toString());
    });

    it("CROWDSALE_3 - nextStage() - Check that not allowed address can not iterate through stages", async function () {
        // try to move to next stage
        await expect(this.test.crowdsale.nextStage({from: user})).to.be.eventually.rejectedWith(EVMRevert);
    });

    it("CROWDSALE_4 - nextStage() - Check iteration through stages", async function () {
        // move to ST1 stage
        await this.test.crowdsale.nextStage({from: allowed});

        // move to ST2 stage
        await this.test.crowdsale.nextStage({from: allowed});

        // move to ST3 stage
        await this.test.crowdsale.nextStage({from: allowed});

        // move to ST4 stage
        await this.test.crowdsale.nextStage({from: allowed});

        // move to Finished stage
        await this.test.crowdsale.nextStage({from: allowed});
    });

    it("CROWDSALE_5 - nextStage() - Check that can not iterate through stages after Finished state reached", async function () {
        // move to ST1 stage
        await this.test.crowdsale.nextStage({from: allowed});

        // move to ST2 stage
        await this.test.crowdsale.nextStage({from: allowed});

        // move to ST3 stage
        await this.test.crowdsale.nextStage({from: allowed});

        // move to ST4 stage
        await this.test.crowdsale.nextStage({from: allowed});

        // move to Finished stage
        await this.test.crowdsale.nextStage({from: allowed});

        // try to move to next stage
        await expect(this.test.crowdsale.nextStage({from: user})).to.be.eventually.rejectedWith(EVMRevert);
    });

    it("CROWDSALE_6 - nextStage() - Check that timestamps changed after moving to next stage", async function () {
        // move to next stage
        await this.test.crowdsale.nextStage({from: allowed});

        // receive current ico status
        let currentStatus = parseInt((await this.test.crowdsale.currentStatus.call()).valueOf());

        // check that status have been changed
        await expect(currentStatus).to.be.equal(Utils.Status.ST1.id);

        // get new stage info
        const stageInfo = await this.test.crowdsale.getStageInfo.call(currentStatus);
        const prevStage = await this.test.crowdsale.getStageInfo.call(Utils.Status.Unknown.id.toString());

        // check that start time is set
        await expect(stageInfo[2].toString()).to.be.not.equal('0');

        // check that prev stage end time is set
        await expect(prevStage[3].toString()).to.be.not.equal('0');

    });

    it("CROWDSALE_7 - invest() - Check that user can not invest before presale start", async function () {
        // try to invest
        await expect(this.test.crowdsale.invest(hexUuid, referral, this.test.sign.v, this.test.sign.r, this.test.sign.s, {from: user, value: 100000})).to.be.eventually.rejectedWith(EVMRevert);
    });

    it("CROWDSALE_8 - invest() - Check that user can invest after presale start", async function () {
        // move to private presale A stage
        await this.test.crowdsale.nextStage({from: allowed});

        // TODO: Must be changed according real stage params
        const weiForInvest = 70;
        const ppDiscount = Utils.Status.ST1.discount;

        // invest
        const res = await this.test.crowdsale.invest(hexUuid, referral, this.test.sign.v, this.test.sign.r, this.test.sign.s, {from: user, value: weiForInvest});

        // check balance changed
        let tokenBalance = await this.test.token.balanceOf.call(user);
        let shouldBeTokens = new BigNumber('0')
            .add(weiForInvest)
            .div(ONE_TOKEN_PRICE_WEI * (100 - ppDiscount) / 100)
            .mul(Utils.powerOfTen(DECIMALS));
        await expect(tokenBalance.toString()).to.be.equal(shouldBeTokens.toString());
    });

    it("CROWDSALE_9 - invest() - Check that user can not invest more that max tokens value inside stage", async function () {
        // move to ST1 stage
        await this.test.crowdsale.nextStage({from: allowed});

        // TODO: Must be changed according real stage params
        const weiForInvest = 7850000000;

        // invest
        await expect(this.test.crowdsale.invest(hexUuid, referral, this.test.sign.v, this.test.sign.r, this.test.sign.s, {from: user, value: weiForInvest})).to.be.eventually.rejectedWith(EVMRevert);
    });

    it("CROWDSALE_10 - invest() - Check that user can not invest more that max tokens value inside stage (several investments)", async function () {
        // move to ST1 stage
        await this.test.crowdsale.nextStage({from: allowed});

        // TODO: Must be changed according stage params
        // TODO: current max tokens for ST1 stage = 112000000
        let weiForInvest1 = 7040000000;
        await this.test.crowdsale.invest(hexUuid, referral, this.test.sign.v, this.test.sign.r, this.test.sign.s, {from: user, value: weiForInvest1});

        let weiForInvest2 = 800000000;
        await this.test.crowdsale.invest(hexUuid, referral, this.test.sign.v, this.test.sign.r, this.test.sign.s, {from: user, value: weiForInvest2});

        let weiForInvest3 = 40000000;
        await expect(this.test.crowdsale.invest(hexUuid, referral, this.test.sign.v, this.test.sign.r, this.test.sign.s, {from: user, value: weiForInvest3})).to.be.eventually.rejectedWith(EVMRevert);
    });

    it("CROWDSALE_11 - invest() - Check that user can not invest in Finished stage", async function () {
        // move to ST1 stage
        await this.test.crowdsale.nextStage({from: allowed});

        // move to ST2 stage
        await this.test.crowdsale.nextStage({from: allowed});

        // move to ST3 stage
        await this.test.crowdsale.nextStage({from: allowed});

        // move to ST4 stage
        await this.test.crowdsale.nextStage({from: allowed});

        // move to Finished stage
        await this.test.crowdsale.nextStage({from: allowed});

        const weiForInvest = 100000;

        // invest
        await expect(this.test.crowdsale.invest(hexUuid, referral, this.test.sign.v, this.test.sign.r, this.test.sign.s, {from: user, value: weiForInvest})).to.be.eventually.rejectedWith(EVMRevert);
    });

    it("CROWDSALE_12 - currentStatus() - Check current status receiving", async function () {
        const res = await this.test.crowdsale.currentStatus.call();
        await expect(res.toString()).to.be.equal(Utils.Status.Unknown.id.toString());
    });

    it("CROWDSALE_13 - allocate() - Check that allocate works", async function () {
        // move to ST1 stage
        await this.test.crowdsale.nextStage({from: allowed});

        let allocWei = 100;

        await this.test.crowdsale.allocate(hexUuid, user, allocWei, referral, {from: allowed});
        let allocateTokens = parseInt((await this.test.token.balanceOf.call(user)).valueOf());

        await this.test.crowdsale.invest(hexUuid, referral, this.test.sign.v, this.test.sign.r, this.test.sign.s, {from: user, value: allocWei});
        let investTokens = parseInt((await this.test.token.balanceOf.call(user)).valueOf());

        await expect(allocateTokens).to.be.equal(investTokens - allocateTokens);
    });

    it("CROWDSALE_14 - allocate() - Check that allocate can be called only from allowed addresses", async function () {
        // move to ST1 stage
        await this.test.crowdsale.nextStage({from: allowed});

        let tokensForAllocate = 10000;
        await expect(this.test.crowdsale.allocate(uuid, user, tokensForAllocate, referral, {from: user})).to.be.eventually.rejectedWith(EVMRevert);
    });

    it("CROWDSALE_15 - verify() - Check that verify works correctly", async function () {
        let signer = new Signer('default');

        let sig = await signer.signInvestParams(uuid, referral, verifier_pk);
        console.log(sig);

        let js_recover_res = signer._web3.eth.accounts.recover(sig);
        console.log(js_recover_res);

        let eth_hash_result = await this.test.crowdsale.getHash.call(Signer.castUuidToHex(uuid), referral);
        console.log('eth hash result: ' + JSON.stringify(eth_hash_result));

        let verify_result = await this.test.crowdsale.verify.call(sig.message, sig.v, sig.r, sig.s);
        console.log('verify res = ' + verify_result);
        console.log('verifier = ' + verifier);

        await expect(verify_result.toString().toLowerCase()).to.be.equal(verifier.toString().toLowerCase());
    });

    it("CROWDSALE_16 - invest() - Check that invest will failed if referral address not right", async function () {
        // move to ST1 stage
        await this.test.crowdsale.nextStage({from: allowed});

        const weiForInvest = 120;

        // invest
        await expect(this.test.crowdsale.invest(hexUuid, user, this.test.sign.v, this.test.sign.r, this.test.sign.s, {from: user, value: weiForInvest})).to.be.eventually.rejectedWith(EVMRevert);
    });
});