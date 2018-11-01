var HDWalletProvider = require("truffle-hdwallet-provider-privkey");

var priv_key = ["7804B2AD10B7EF7200678B2EA42C78B4A66DF5FB264A4867C38C859DD5DA38DC"];
var main_pk = ["A9302AD2F3B04DD12EBF54F94C2B331A8D44333899D7AFA18E45D67623CD6D8D"];

module.exports = {
    networks: {
        ropsten_metamask: {
            provider: () => new HDWalletProvider(priv_key, "https://ropsten.infura.io/8PB8Cnu6sYpZu5VVtEDl"),
            // from: "0x000d52F3F993Eb84AC0Fb8D2896Dc46f61814a13",
            network_id: 3,
            gas: 4612388,
            gasPrice: 5000000000
        },
        kovan_metamask: {
            provider: () => new HDWalletProvider(priv_key, "https://kovan.infura.io/8PB8Cnu6sYpZu5VVtEDl"),
            // from: "0x000d52F3F993Eb84AC0Fb8D2896Dc46f61814a13",
            network_id: 3,
            gas: 4612388
        },
        mainnet_metamask: {
            provider: () => new HDWalletProvider(main_pk, "https://mainnet.infura.io/8PB8Cnu6sYpZu5VVtEDl"),
            // from: "0xd3ba1ac16073ca8d10b29cf89d5b89c10661503d",
            network_id: 1,
            gas: 4612388,
            gasPrice: 15000000000
        }
    }
};
