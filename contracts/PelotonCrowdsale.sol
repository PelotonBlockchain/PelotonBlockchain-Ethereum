pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./interfaces/PricingStrategyInterface.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "./PelotonReferrals.sol";

contract PelotonCrowdsale is AllowedAddresses {
    using SafeMath for uint256;

    enum Status {Unknown, ST1, ST2, ST3, ST4, Finished}

    struct Stage {
        uint256 sold;
        uint256 discount;
        uint256 maxTokens;
        uint256 startTime;
        uint256 endTime;
    }

    DetailedERC20 public token;
    address public wallet;
    PricingStrategyInterface public pricingStrategy;
    address public verifier;
    PelotonReferrals public referrals;

    mapping(address => uint256) public addressTokens;
    mapping(address => uint256) public addressWei;
    mapping(bytes32 => uint256) public uuidTokens;
    mapping(bytes32 => uint256) public uuidWei;
    mapping(uint256 => Stage) public stages;

    Status public currentStatus = Status.Unknown;
    uint256 public tokensSold = 0;
    uint256 public weiReceived = 0;


    event NextStage(address _from, uint256 _timestamp, Status _currentStatus, uint256 _discount, uint256 _maxTokens);
    event PricingStrategyChanged(address _from, address _prevAddress, address _newAddress);
    event Invested(bytes32 _uuid, address _investor, uint256 _timestamp, uint256 _wei, uint256 _tokens, address _referral);
    event VerifierChanged(address _from, address _prevAddress, address _newAddress);

    /// @dev modifier that allow to call function if current status is bigger than specified
    modifier statusAfter(Status _status) {
        require(uint256(currentStatus) > uint256(_status));
        _;
    }

    /// @dev modifier that allow to call function if current status is less than specified
    modifier statusBefore(Status _status) {
        require(uint256(currentStatus) < uint256(_status));
        _;
    }

    constructor(DetailedERC20 _token, address _wallet, PricingStrategyInterface _pricingStrategy, address _verifier, PelotonReferrals _referrals) public {
        owner = msg.sender;
        token = _token;
        wallet = _wallet;
        pricingStrategy = _pricingStrategy;
        verifier = _verifier;
        referrals = _referrals;

        // Starting stage for crowdsale, doesn't sale any tokens
        stages[uint256(Status.Unknown)] = Stage({
            sold : 0,
            discount : 0,
            maxTokens : 0,
            startTime : 0,
            endTime : 0
            });

        stages[uint256(Status.ST1)] = Stage({
            sold: 0,
            discount : 30,
            maxTokens : 112000000 * (10 ** uint256(token.decimals())),
            startTime: 0,
            endTime: 0
            });

        stages[uint256(Status.ST2)] = Stage({
            sold: 0,
            discount : 20,
            maxTokens : 64000000 * (10 ** uint256(token.decimals())),
            startTime: 0,
            endTime: 0
            });

        stages[uint256(Status.ST3)] = Stage({
            sold: 0,
            discount : 10,
            maxTokens : 48000000 * (10 ** uint256(token.decimals())),
            startTime: 0,
            endTime: 0
            });

        stages[uint256(Status.ST4)] = Stage({
            sold: 0,
            discount : 0,
            maxTokens : 16000000 * (10 ** uint256(token.decimals())),
            startTime: 0,
            endTime: 0
            });

        // Final stage of ICO that indicate that ICO is ended, doesn't sale any tokens
        stages[uint256(Status.Finished)] = Stage({
            sold: 0,
            discount : 0,
            maxTokens : 0,
            startTime: 0,
            endTime: 0
            });
    }

    /// @dev function is set next status (from Status enum) for crowdsale and fill info for current and next stage
    /// can be called only from allowed addresses
    function nextStage() statusBefore(Status.Finished) onlyAllowedAddresses external {
        uint256 currentTime = now;

        // update prev stage end time
        Stage storage prevStage = getStage(currentStatus);
        prevStage.endTime = currentTime;

        // move to next stage
        uint256 nextStatus = uint256(currentStatus) + 1;
        currentStatus = Status(nextStatus);

        // get nex stage struct
        Stage storage currentStage = getStage(currentStatus);

        // set start time
        currentStage.startTime = currentTime;

        // update disciunt for pricing strategy
        bool isUpdated = pricingStrategy.setTokenDiscount(currentStage.discount);
        require(isUpdated);

        emit NextStage(
            msg.sender,
            currentTime,
            currentStatus,
            currentStage.discount,
            currentStage.maxTokens
        );
    }

    /// @dev function that allow users to buy tokens, that are calculated using pricing strategy contract
    function invest(bytes32 _uuid, address _referral, uint8 v, bytes32 r, bytes32 s) statusAfter(Status.Unknown) statusBefore(Status.Finished) external payable {
        require(msg.value > 0);

        address verifyAddress = verify(keccak256(abi.encodePacked(_uuid, _referral)), v, r, s);
        require(verifyAddress == verifier);

        Stage storage currentStage = getStage(currentStatus);
        require(currentStage.sold < currentStage.maxTokens);

        uint256 tokens = pricingStrategy.calculatePrice(msg.value, token.decimals());
        require(tokens > 0);

        uint256 tokensLeft = currentStage.maxTokens.sub(currentStage.sold);
        require(tokensLeft >= tokens);

        currentStage.sold = currentStage.sold.add(tokens);

        addressTokens[msg.sender] = addressTokens[msg.sender].add(tokens);
        addressWei[msg.sender] = addressWei[msg.sender].add(msg.value);
        uuidTokens[_uuid] = uuidTokens[_uuid].add(tokens);
        uuidWei[_uuid] = uuidWei[_uuid].add(msg.value);
        tokensSold = tokensSold.add(tokens);
        weiReceived = weiReceived.add(msg.value);

        token.transferFrom(owner, msg.sender, tokens);
        wallet.transfer(msg.value);
        referrals.update(_referral, tokens);

        emit Invested(_uuid, msg.sender, now, msg.value, tokens, _referral);
    }

    event Left(uint256 _left, uint256 _current, uint256 _wei, bool _result);

    /// @dev function that allow users to buy tokens, that are calculated using pricing strategy contract
    function allocate(bytes32 _uuid, address _to, uint256 _wei, address _referral) onlyAllowedAddresses statusAfter(Status.Unknown) statusBefore(Status.Finished) external {
        Stage storage currentStage = getStage(currentStatus);
        require(currentStage.sold < currentStage.maxTokens);

        uint256 tokens = pricingStrategy.calculatePrice(_wei, token.decimals());
        require(tokens > 0);

        tokens = tokens.add(calcBonusTokens(tokens));
        uint256 tokensLeft = currentStage.maxTokens - 0;
        require(tokensLeft >= tokens);

        currentStage.sold = currentStage.sold.add(tokens);

        addressTokens[_to] = addressTokens[_to].add(tokens);
        addressWei[_to] = addressWei[_to].add(_wei);
        uuidTokens[_uuid] = uuidTokens[_uuid].add(tokens);
        uuidWei[_uuid] = uuidWei[_uuid].add(msg.value);
        tokensSold = tokensSold.add(tokens);
        weiReceived = weiReceived.add(_wei);

        token.transferFrom(owner, _to, tokens);
        referrals.update(_referral, tokens);

        emit Invested(_uuid, _to, now, _wei, tokens, _referral);
    }

    /// @dev set new pricing strategy contract
    function setPricingStartegy(PricingStrategyInterface _pricingStrategy) onlyOwner external {
        require(_pricingStrategy.isPricingStrategy());
        emit PricingStrategyChanged(msg.sender, pricingStrategy, _pricingStrategy);

        pricingStrategy = _pricingStrategy;
    }

    /// @dev set new address that will verify investments
    function setVerifier(address _addr) onlyOwner external {
        emit VerifierChanged(msg.sender, verifier, _addr);
        verifier = _addr;
    }

    /// @dev get info about specified stage
    function getStageInfo(Status _status) external view returns (uint256 _discount, uint256 _maxTokens, uint256 _start, uint256 _end) {
        Stage memory currentStage = getStage(_status);
        _discount = currentStage.discount;
        _maxTokens = currentStage.maxTokens;
        _start = currentStage.startTime;
        _end = currentStage.endTime;
    }

    /// @dev internal function for getting specified stage object
    function getStage(Status _status) internal view returns (Stage storage) {
        uint256 index = uint256(_status);
        return stages[index];
    }

    function getHash(bytes32 _uuid, address _referral) external returns(bytes32 hash, bytes32 uuid) {
        uuid = _uuid;
        hash = keccak256(abi.encodePacked(_uuid, _referral));
    }

    /// @dev verify hash signature
    function verify(bytes32 hash, uint8 v, bytes32 r, bytes32 s) public view returns(address) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, hash));
        return ecrecover(prefixedHash, v, r, s);
    }

    function calcBonusTokens(uint256 _bought) internal returns(uint256) {
        if (tokensSold >= 0 && tokensSold <= 1000000000 * (10 * uint256(token.decimals()))) {
            return calcBonusPercent(_bought, 30);
        }

        return 0;
    }

    function calcBonusPercent(uint256 _bought, uint256 _percent) internal pure returns(uint256) {
        uint256 bonus = _bought.mul(_percent).div(100);
        return bonus;
    }
}
