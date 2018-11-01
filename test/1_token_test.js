const BigNumber = web3.BigNumber;

const expect = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .expect;

const EVMRevert = require('./helpers/EVMRevert');

const Token = artifacts.require("PelotonToken");

const deployToken = () => {
    return Token.new("Peloton Token", "PLTN", 18);
};

contract('PelotonToken', function (accounts) {
    const owner = accounts[0];
    const user = accounts[1];
    const secondUser = accounts[2];

    const tokenName = "Peloton Token";
    const tokenSymbol = "PLTN";
    const tokenDecimals = "18";
    const totalSupply = new BigNumber("300000000e18");

    beforeEach(async function deployContracts() {
        this.currentTest.token = await deployToken();
        await this.currentTest.token.unlock();
    });

    it("ERC20_1 - name() - Check token name", async function () {
        const res = await this.test.token.name.call();
        await expect(res.valueOf()).to.be.equal(tokenName);
    });

    it("ERC20_2 - symbol() - Check token symbol", async function () {
        const res = await this.test.token.symbol.call();
        await expect(res.valueOf()).to.be.equal(tokenSymbol);
    });

    it("ERC20_3 - decimals() - Check token decimals", async function () {
        const res = await this.test.token.decimals.call();
        await expect(res.valueOf()).to.be.equal(tokenDecimals);
    });

    it("ERC20_4 - totalSupply() - Check token total supply", async function () {
        const res = await this.test.token.totalSupply.call();
        await expect(new BigNumber(res.valueOf()).toString()).to.be.equal(totalSupply.toString());
    });

    it("ERC20_5 - balanceOf() - Check owner balance", async function () {
        const res = await this.test.token.balanceOf.call(owner);
        await expect(new BigNumber(res.valueOf()).toString()).to.be.equal(totalSupply.toString());
    });

    it("ERC20_6 - transfer() - Check that user can transfer tokens", async function () {
        const tokensToSend = new BigNumber("1e18");

        let res = await this.test.token.balanceOf.call(owner);
        const ownerBalanceBefore = new BigNumber(res.valueOf());

        res = await this.test.token.balanceOf.call(user);
        const userBalanceBefore = new BigNumber(res.valueOf());

        await this.test.token.transfer(user, tokensToSend);

        res = await this.test.token.balanceOf.call(owner);
        await expect(new BigNumber(res.valueOf()).toString()).to.be.equal(ownerBalanceBefore.minus(tokensToSend).toString());

        res = await this.test.token.balanceOf.call(user);
        await expect(new BigNumber(res.valueOf()).toString()).to.be.equal(userBalanceBefore.plus(tokensToSend).toString());
    });

    it("ERC20_7 - transfer() - Check user can not transfer more tokens than have", async function () {
        const tokensToSend = new BigNumber("1e18");
        await this.test.token.transfer(user, tokensToSend);

        const moreThanBlance = new BigNumber("10e18");
        await expect(this.test.token.transfer(owner, moreThanBlance, {from: user})).to.eventually.be.rejectedWith(EVMRevert);
    });

    it("ERC20_8 - transfer() - Check if 0 tokens transfrered balances of receiver and sender not changed", async function () {
        const tokensToSend = new BigNumber("0");

        let res = await this.test.token.balanceOf.call(owner);
        const ownerBalanceBefore = new BigNumber(res.valueOf());

        res = await this.test.token.balanceOf.call(user);
        const userBalanceBefore = new BigNumber(res.valueOf());

        await this.test.token.transfer(owner, tokensToSend, {from: user});

        res = await this.test.token.balanceOf.call(owner);
        await expect(new BigNumber(res.valueOf()).toString()).to.be.equal(ownerBalanceBefore.toString());

        res = await this.test.token.balanceOf.call(user);
        await expect(new BigNumber(res.valueOf()).toString()).to.be.equal(userBalanceBefore.toString());
    });

    it("ERC20_9 - transferFrom() - Check that transferFrom() works", async function () {
        const tokensToSend = new BigNumber("10e18");

        let res = await this.test.token.balanceOf.call(user);
        const userBalanceBefore = new BigNumber(res.valueOf());

        await this.test.token.approve(user, tokensToSend, {from: owner});

        await this.test.token.transferFrom(owner, user, tokensToSend, {from: user});

        res = await this.test.token.balanceOf.call(user);
        await expect(new BigNumber(res.valueOf()).toString()).to.be.equal(userBalanceBefore.plus(tokensToSend).toString());
    });


    it("ERC20_10 - transferFrom() - Check that user can not send unapproved tokens", async function () {
        const tokensToSend = new BigNumber("10e18");

        //await test.token.approve(user, tokensToSend, {from: owner});

        await expect(this.test.token.transferFrom(owner, user, tokensToSend, {from: user})).to.eventually.be.rejectedWith(EVMRevert);
    });


    it("ERC20_11 - approve() - Check that user can approve tokens", async function () {
        const tokensToSend = new BigNumber("10e18");

        await this.test.token.approve(user, tokensToSend, {from: owner});

        const res = await this.test.token.allowance.call(owner, user);
        await expect(new BigNumber(res.valueOf()).toString()).to.be.equal(tokensToSend.toString());
    });

    it("ERC20_12 - approve() - Check that user can change approved tokens amount", async function () {
        const tokensToSend = new BigNumber("10e18");
        const newTokensToSend = new BigNumber("12e18");

        await this.test.token.approve(user, tokensToSend, {from: owner});

        await this.test.token.approve(user, newTokensToSend, {from: owner});

        const res = await this.test.token.allowance.call(owner, user);
        await expect(new BigNumber(res.valueOf()).toString()).to.be.equal(newTokensToSend.toString());
    });

    it("ERC20_13 - allowance() - Check that user can change approved tokens amount", async function () {
        const tokensToSend = new BigNumber("10e18");

        await this.test.token.approve(user, tokensToSend, {from: owner});

        const res = await this.test.token.allowance.call(owner, user);
        await expect(new BigNumber(res.valueOf()).toString()).to.be.equal(tokensToSend.toString());
    });

    it("ERC20_14 - transferFrom() - Check that user can not send unapproved tokens", async function () {
        const tokensToSend = new BigNumber("10e18");
        const moreTokensThanApproved = new BigNumber("14e18");

        await this.test.token.approve(user, tokensToSend, {from: owner});

        await expect(this.test.token.transferFrom(owner, user, moreTokensThanApproved, {from: user})).to.eventually.be.rejectedWith(EVMRevert);
    });

    it("ERC20_15 - increaseApproval() - Check that user can increase approved tokens", async function () {
        const tokensToSend = new BigNumber("10e18");

        await this.test.token.approve(user, tokensToSend, {from: owner});
        await this.test.token.increaseApproval(user, tokensToSend, {from: owner});

        const res = await this.test.token.allowance.call(owner, user);
        await expect(new BigNumber(res.valueOf()).toString()).to.be.equal(tokensToSend.mul(2).toString());
    });

    it("ERC20_16 - decreaseApproval() - Check that user can decrease approved tokens", async function () {
        const tokensToSend = new BigNumber("10e18");

        await this.test.token.approve(user, tokensToSend, {from: owner});
        await this.test.token.decreaseApproval(user, tokensToSend, {from: owner});

        const res = await this.test.token.allowance.call(owner, user);
        await expect(new BigNumber(res.valueOf()).toString()).to.be.equal('0');
    });

    it("ERC20_17 - setUnlocked() - Check that owner can transfer tokens", async function () {
        const tokensToSend = new BigNumber("10e18");

        await this.test.token.lock();
        await this.test.token.transfer(user, tokensToSend, {from: owner});
    });

    it("ERC20_18 - setUnlocked() - Check that unlocked user can transfer tokens", async function () {
        const tokensToSend = new BigNumber("10e18");

        await this.test.token.lock();
        await this.test.token.transfer(user, tokensToSend, {from: owner});
        await this.test.token.setUnlocked(user, true, {from: owner});
        await this.test.token.transfer(secondUser, tokensToSend, {from: user});
    });

    it("ERC20_19 - setUnlocked() - Check that locked user can not transfer tokens", async function () {
        const tokensToSend = new BigNumber("10e18");

        await this.test.token.lock();
        await this.test.token.transfer(user, tokensToSend, {from: owner});

        await expect(this.test.token.transfer(secondUser, tokensToSend, {from: user})).to.be.eventually.rejectedWith(EVMRevert);
    });

    it("ERC20_20 - unlock() - Check that after unlock everyone can transfer tokens", async function () {
        const tokensToSend = new BigNumber("10e18");

        await this.test.token.lock();
        await this.test.token.transfer(user, tokensToSend, {from: owner});
        await this.test.token.unlock();

        await this.test.token.transfer(secondUser, tokensToSend, {from: user});
    });

    it("ERC20_21 - lock() - Check that transferFrom() not working after lock", async function () {
        const tokensToSend = new BigNumber("10e18");

        await this.test.token.lock();
        await this.test.token.transfer(user, tokensToSend, {from: owner});
        await this.test.token.approve(user, tokensToSend, {from: owner});

        await expect(this.test.token.transferFrom(owner, secondUser, tokensToSend, {from: user})).to.be.eventually.rejectedWith(EVMRevert);
    });

    it("ERC20_22 - burningConvert() - Check that burning convert burn user tokens", async function () {
        const tokensToSend = new BigNumber("10e18");
        const tokensToBurn = new BigNumber("7e18");
        await this.test.token.transfer(user, tokensToSend, {from: owner});
        await this.test.token.burningConvert(tokensToBurn, {from: user});

        let balance = await this.test.token.balanceOf.call(user);
        await expect(balance.toString()).to.be.equal(tokensToSend.sub(tokensToBurn).toString());
    });

});