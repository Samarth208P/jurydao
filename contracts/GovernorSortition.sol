// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@pythnetwork/entropy-sdk-solidity/IEntropy.sol";
import "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";

interface IJurorRegistry {
    function getJurorCount() external view returns (uint256);
    function getJurorAtIndex(uint256 index) external view returns (address);
    function isJuror(address account) external view returns (bool);
}

contract GovernorSortition is IEntropyConsumer {
    enum State { Pending, Active, Defeated, Succeeded, Executed }

    struct Proposal {
        string title;
        string description;
        address proposer;
        uint256 forVotes;
        uint256 againstVotes;
        uint64 deadline;
        State state;
        uint256 jurySize;
        uint256 unspentGasFees;
    }

    IEntropy public immutable entropy;
    address public immutable entropyProvider;
    IJurorRegistry public immutable registry;
    address public immutable owner;

    uint256 public proposalCount;
    uint256 public constant MIN_VOTING_PERIOD = 1 hours;
    uint256 public constant MAX_VOTING_PERIOD = 30 days;
    uint256 public constant GAS_REFUND_PER_VOTE = 0.0005 ether;
    uint256 public constant BASE_FEE = 0.01 ether; // Increased for callback gas

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => address[]) public jurors;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => bool)) public isSelectedJuror;
    mapping(uint64 => uint256) public sequenceToProposal;

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title, uint256 jurySize, uint256 deadline, uint256 totalCost);
    event JurorsSelected(uint256 indexed proposalId, address[] jurors);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support);
    event Executed(uint256 indexed proposalId, State finalState);
    event GasRefunded(uint256 indexed proposalId, address indexed juror, uint256 amount);

    error InvalidTitle();
    error InvalidDescription();
    error InvalidJurySize();
    error JurySizeExceedsAvailable();
    error VotingPeriodTooShort();
    error VotingPeriodTooLong();
    error InsufficientPayment();
    error InvalidState();
    error NotEnoughJurors();
    error NotActive();
    error VotingEnded();
    error AlreadyVoted();
    error NotSelectedJuror();
    error VotingNotEnded();

    constructor(address _entropy, address _entropyProvider, address _registry) payable {
        require(_entropy != address(0), "Invalid entropy");
        require(_entropyProvider != address(0), "Invalid provider");
        require(_registry != address(0), "Invalid registry");

        entropy = IEntropy(_entropy);
        entropyProvider = _entropyProvider;
        registry = IJurorRegistry(_registry);
        owner = msg.sender;
    }

    function getRequiredPayment(uint256 _jurySize) public pure returns (uint256) {
        return ( BASE_FEE * 3) + (_jurySize * GAS_REFUND_PER_VOTE);
    }

    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _jurySize,
        uint256 _votingPeriodSeconds
    ) external payable returns (uint256) {
        if (bytes(_title).length == 0) revert InvalidTitle();
        if (bytes(_description).length == 0) revert InvalidDescription();
        if (_jurySize == 0) revert InvalidJurySize();

        uint256 availableJurors = registry.getJurorCount();
        require(availableJurors > 0, "No jurors registered");
        if (_jurySize > availableJurors) revert JurySizeExceedsAvailable();
        if (_votingPeriodSeconds < MIN_VOTING_PERIOD) revert VotingPeriodTooShort();
        if (_votingPeriodSeconds > MAX_VOTING_PERIOD) revert VotingPeriodTooLong();

        uint256 requiredPayment = getRequiredPayment(_jurySize);
        if (msg.value < requiredPayment) revert InsufficientPayment();

        uint256 gasFees = _jurySize * GAS_REFUND_PER_VOTE;
        uint256 proposalId = proposalCount++;
        uint64 deadline = uint64(block.timestamp + _votingPeriodSeconds);

        proposals[proposalId] = Proposal({
            title: _title,
            description: _description,
            proposer: msg.sender,
            forVotes: 0,
            againstVotes: 0,
            deadline: deadline,
            state: State.Pending,
            jurySize: _jurySize,
            unspentGasFees: gasFees
        });

        emit ProposalCreated(proposalId, msg.sender, _title, _jurySize, deadline, msg.value);

        bytes32 userRandomNumber = keccak256(abi.encodePacked(
            block.timestamp,
            msg.sender,
            proposalId,
            block.prevrandao
        ));


        uint64 sequenceNumber = entropy.requestWithCallback{value: BASE_FEE * 3}(
            entropyProvider,
            userRandomNumber
        );

        sequenceToProposal[sequenceNumber] = proposalId;

        // Refund excess payment
        if (msg.value > requiredPayment) {
            (bool success, ) = msg.sender.call{value: msg.value - requiredPayment}("");
            require(success, "Refund failed");
        }

        return proposalId;
    }

    function entropyCallback(
        uint64 sequenceNumber,
        address,
        bytes32 randomNumber
    ) internal override {
        uint256 proposalId = sequenceToProposal[sequenceNumber];
        Proposal storage prop = proposals[proposalId];

        if (prop.state != State.Pending) revert InvalidState();

        uint256 totalJurors = registry.getJurorCount();
        if (totalJurors < prop.jurySize) revert NotEnoughJurors();

        address[] memory selectedJurors = new address[](prop.jurySize);
        uint256 randomSeed = uint256(randomNumber);

        uint256[] memory indices = new uint256[](totalJurors);
        for (uint256 i = 0; i < totalJurors; i++) {
            indices[i] = i;
        }

        for (uint256 i = 0; i < prop.jurySize; i++) {
            uint256 randomIndex = i + (uint256(keccak256(abi.encodePacked(randomSeed, i))) % (totalJurors - i));

            uint256 temp = indices[i];
            indices[i] = indices[randomIndex];
            indices[randomIndex] = temp;

            address juror = registry.getJurorAtIndex(indices[i]);
            selectedJurors[i] = juror;
            isSelectedJuror[proposalId][juror] = true;
        }

        jurors[proposalId] = selectedJurors;
        prop.state = State.Active;

        emit JurorsSelected(proposalId, selectedJurors);
    }

    function vote(uint256 id, bool support) external {
        Proposal storage prop = proposals[id];

        if (prop.state != State.Active) revert NotActive();
        if (block.timestamp >= prop.deadline) revert VotingEnded();
        if (hasVoted[id][msg.sender]) revert AlreadyVoted();
        if (!isSelectedJuror[id][msg.sender]) revert NotSelectedJuror();

        hasVoted[id][msg.sender] = true;

        if (support) {
            prop.forVotes++;
        } else {
            prop.againstVotes++;
        }

        emit Voted(id, msg.sender, support);

        if (GAS_REFUND_PER_VOTE > 0 && prop.unspentGasFees >= GAS_REFUND_PER_VOTE) {
            prop.unspentGasFees -= GAS_REFUND_PER_VOTE;
            (bool success, ) = msg.sender.call{value: GAS_REFUND_PER_VOTE}("");
            if (success) {
                emit GasRefunded(id, msg.sender, GAS_REFUND_PER_VOTE);
            } else {
                prop.unspentGasFees += GAS_REFUND_PER_VOTE;
            }
        }

        uint256 totalVotes = prop.forVotes + prop.againstVotes;
        if (totalVotes >= prop.jurySize) {
            _executeProposal(id);
        }
    }

    function execute(uint256 id) external {
        Proposal storage prop = proposals[id];
        if (prop.state != State.Active) revert NotActive();

        uint256 totalVotes = prop.forVotes + prop.againstVotes;
        if (block.timestamp < prop.deadline && totalVotes < prop.jurySize) {
            revert VotingNotEnded();
        }

        _executeProposal(id);
    }

    function _executeProposal(uint256 id) private {
        Proposal storage prop = proposals[id];
        prop.state = prop.forVotes > prop.againstVotes ? State.Succeeded : State.Defeated;
        emit Executed(id, prop.state);
    }

    function withdrawFees() external {
        require(msg.sender == owner, "Only owner");

        uint256 reserved = 0;
        for (uint256 i = 0; i < proposalCount; i++) {
            if (proposals[i].state == State.Pending || proposals[i].state == State.Active) {
                reserved += proposals[i].unspentGasFees;
            }
        }

        uint256 balance = address(this).balance;
        uint256 withdrawable = balance > reserved ? balance - reserved : 0;
        require(withdrawable > 0, "No fees to withdraw");

        (bool success, ) = msg.sender.call{value: withdrawable}("");
        require(success, "Withdrawal failed");
    }

    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }

    function getProposal(uint256 id) external view returns (
        string memory title,
        string memory description,
        address proposer,
        uint256 forVotes,
        uint256 againstVotes,
        uint64 deadline,
        State state,
        uint256 jurySize,
        uint256 unspentGasFees
    ) {
        Proposal memory prop = proposals[id];
        return (
            prop.title,
            prop.description,
            prop.proposer,
            prop.forVotes,
            prop.againstVotes,
            prop.deadline,
            prop.state,
            prop.jurySize,
            prop.unspentGasFees
        );
    }

    function getJurors(uint256 id) external view returns (address[] memory) {
        return jurors[id];
    }

    receive() external payable {}
}
