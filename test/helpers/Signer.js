const Web3 = require('web3');
const uuidParse = require('uuid-parse');

class Signer {
    constructor(host) {
        if (host === 'default') {
            host = 'http://127.0.0.1:9545';
        }

        this._web3 = new Web3(new Web3.providers.HttpProvider(host));
    }

    static castUuidToHex(uuid) {
        let buff = new Buffer.alloc(16);
        uuidParse.parse(uuid, buff);
        return '0x' + buff.toString('hex');
    }

    static parseSignature(sig) {
        if (sig.v) {
            return sig;
        }

        console.log('sig length = ' + sig.length);
        console.log('signature = ' + sig);
        let r = sig.substring(0, 66);
        let s = `0x${sig.substring(66, 130)}`;
        let v = `0x${sig.substring(130, 132)}`;

        return {
            r,
            s,
            v
        }
    }

    async sign(msg, signer_address) {
        return await this._web3.eth.accounts.sign(msg, signer_address);
    }

    async signInvestParams(uuid, referral_address, sign_pk) {
        const hexUuid = Signer.castUuidToHex(uuid);

        let hash = this._web3.utils.soliditySha3({t: 'bytes32', v: hexUuid}, {t: 'address', v: referral_address});

        let signature = await this._web3.eth.accounts.sign(hash, sign_pk);
        return Signer.parseSignature(signature);
    }
}

module.exports = Signer;