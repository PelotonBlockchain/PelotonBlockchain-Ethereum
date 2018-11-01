const BigNumber = web3.BigNumber;

exports.Status = {
    "Unknown": {
        id: 0,
        discount: 0,
        maxTokens: 0
    },
    "ST1": {
        id: 1,
        discount: 30,
        maxTokens: 112000000
    },
    "ST2": {
        id: 2,
        discount: 20,
        maxTokens: 64000000
    },
    "ST3": {
        id: 3,
        discount: 10,
        maxTokens: 48000000
    },
    "ST4": {
        id: 4,
        discount: 0,
        maxTokens: 16000000
    },
    "Finished": {
        id: 8,
        discount: 0,
        maxTokens: 0
    },
    withDecimals: function (tokens) {
        return new BigNumber(tokens).mul(new BigNumber('1e18'));
    }
};

exports.ZeroAddress = "0x0000000000000000000000000000000000000000";

exports.powerOfTen = function (exp) {
    parseInt(exp);
    if (exp === 0) {
        return 1;
    } else if (exp > 0) {
        let result = 1;
        for (let i = 0; i < exp; i++) {
            result = result * 10;
        }
        return result;
    }
    return 0;
};

exports.fetchPureArray = function (res, parseFunc) {
    let arr = [];
    for (let key in res) {
        if (parseFunc != null) {
            arr.push(parseFunc(res[key].valueOf()));
        } else {
            arr.push(res[key].valueOf());
        }
    }
    return arr;
};

