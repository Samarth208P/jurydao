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
        bool feesSponsoredByProposer;
        uint256 gasPerVote; // The gas refund amount *at the time of creation*
        uint256 unspentGasFees; // Tracks remaining fees to be reclaimed
    }

    IEntropy public immutable entropy;
    address public immutable entropyProvider;
    IJurorRegistry public immutable registry;
    address public immutable owner;

    uint256 public proposalCount;
    uint256 public constant MIN_VOTING_PERIOD = 1 hours;
    uint256 public constant MAX_VOTING_PERIOD = 30 days;
    uint256 public gasRefundAmount = 0.001 ether; // Default, can be changed by owner

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => address[]) public jurors;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => bool)) public isSelectedJuror; // For O(1) vote check
    mapping(uint64 => uint256) public sequenceToProposal;

    // --- Events ---
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 jurySize,
        uint256 deadline,
        bool feesSponsoredByProposer,
        uint256 totalFeesDeposited
    );
    event JurorsSelected(uint256 indexed proposalId, address[] jurors);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support);
    event Executed(uint256 indexed proposalId, State finalState);
    event GasRefunded(uint256 indexed proposalId, address indexed juror, uint256 amount);
    event FeesReclaimed(uint256 indexed proposalId, address indexed proposer, uint256 amount);
    event GasRefundAmountUpdated(uint256 newAmount);

    // --- Errors ---
    error InvalidTitle();
    error InvalidDescription();
    error InvalidJurySize();
    error JurySizeExceedsAvailable();
    error VotingPeriodTooShort();
    error VotingPeriodTooLong();
    error InsufficientFees();
    error InvalidState();
    error NotEnoughJurors();
    error NotActive();
    error VotingEnded();
    error AlreadyVoted();
    error NotSelectedJuror();
    error VotingNotEnded();
    error ProposalNotFinished();
    error NotProposer();
    error NoFeesToReclaim();

    constructor(
        address _entropy,
        address _entropyProvider,
        address _registry
    ) payable {
        require(_entropy != address(0), "Invalid entropy address");
        require(_entropyProvider != address(0), "Invalid provider address");
        require(_registry != address(0), "Invalid registry address");

        entropy = IEntropy(_entropy);
        entropyProvider = _entropyProvider;
        registry = IJurorRegistry(_registry);
        owner = msg.sender;
    }

    /// @notice Get dynamic fee required for creating a proposal
    /// @param _jurySize Number of jurors for the proposal
    /// @param _sponsorFees Whether proposer sponsors gas fees for jurors
    /// @return Total required ETH (Entropy fee + optional gas sponsorship)
    function getRequiredFee(uint256 _jurySize, bool _sponsorFees) public view returns (uint256) {
        uint256 entropyFee = entropy.getFee(entropyProvider); // Dynamic Pyth fee
        uint256 gasCost = _sponsorFees ? (_jurySize * gasRefundAmount) : 0;
        return entropyFee + gasCost;
    }

    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _jurySize,
        uint256 _votingPeriodSeconds,
        bool _sponsorFees
    ) external payable returns (uint256) {
        if (bytes(_title).length == 0) revert InvalidTitle();
        if (bytes(_description).length == 0) revert InvalidDescription();
        if (_jurySize == 0) revert InvalidJurySize();

        uint256 availableJurors = registry.getJurorCount();
        if (_jurySize > availableJurors) revert JurySizeExceedsAvailable();
        if (_votingPeriodSeconds < MIN_VOTING_PERIOD) revert VotingPeriodTooShort();
        if (_votingPeriodSeconds > MAX_VOTING_PERIOD) revert VotingPeriodTooLong();

        // [FIX #4 & #5] Get fee ONCE and use current gasRefundAmount
        uint256 currentGasRefund = gasRefundAmount;
        uint256 entropyFee = entropy.getFee(entropyProvider);
        uint256 gasCost = _sponsorFees ? (_jurySize * currentGasRefund) : 0;
        uint256 requiredFee = entropyFee + gasCost;

        if (msg.value < requiredFee) revert InsufficientFees();

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
            feesSponsoredByProposer: _sponsorFees,
            gasPerVote: currentGasRefund, // [FIX #5] Lock in the rate
            unspentGasFees: gasCost      // [FIX #1] Initialize unspent fees
        });

        emit ProposalCreated(
            proposalId,
            msg.sender,
            _title,
            _jurySize,
            deadline,
            _sponsorFees,
            msg.value
        );

        // Request randomness with dynamic fee
        bytes32 userRandomNumber = keccak256(
            abi.encodePacked(block.timestamp, msg.sender, proposalId, block.prevrandao)
        );

        // [FIX #4] Use the fee fetched earlier
        uint64 sequenceNumber = entropy.requestWithCallback{value: entropyFee}(
            entropyProvider,
            userRandomNumber
        );

        sequenceToProposal[sequenceNumber] = proposalId;

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

        // [FIX #2] Efficient Selection Sampling (Algorithm S)
        address[] memory selectedJurors = new address[](prop.jurySize);
        uint256 selected = 0;
        uint256 randomSeed = uint256(randomNumber);
        uint256 jurorsLeftToSelect = prop.jurySize;

        for (uint256 i = 0; i < totalJurors && selected < prop.jurySize; i++) {
            uint256 jurorsLeftInPool = totalJurors - i;

            // Generate a new random number for each decision
            uint256 rand = uint256(keccak256(abi.encodePacked(randomSeed, i)));

            // Probability check: (rand % pool) < (needed)
            if (rand % jurorsLeftInPool < jurorsLeftToSelect) {
                address juror = registry.getJurorAtIndex(i);
                selectedJurors[selected] = juror;
                isSelectedJuror[proposalId][juror] = true; // [FIX #3] Populate mapping
                selected++;
                jurorsLeftToSelect--;
            }
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

        // [FIX #3] O(1) gas-efficient check
        if (!isSelectedJuror[id][msg.sender]) revert NotSelectedJuror();

        hasVoted[id][msg.sender] = true;

        if (support) {
            prop.forVotes++;
        } else {
            prop.againstVotes++;
        }

        emit Voted(id, msg.sender, support);

        // [FIX #1] Gas refund and fee tracking
        if (prop.feesSponsoredByProposer && prop.gasPerVote > 0) {
            (bool success, ) = msg.sender.call{value: prop.gasPerVote}("");
            if (success) {
                prop.unspentGasFees -= prop.gasPerVote; // Decrement unspent amount
                emit GasRefunded(id, msg.sender, prop.gasPerVote);
            }
            // If call fails, unspentGasFees is NOT decremented,
            // allowing proposer to reclaim it.
        }

        // Auto-execute if all jurors have voted
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
        // Note: A tie (for == against) results in Defeated
        prop.state = prop.forVotes > prop.againstVotes ? State.Succeeded : State.Defeated;
        emit Executed(id, prop.state);
    }

    // --- New Functions ---

    /**
     * @notice Allows the original proposer to reclaim unspent gas fees
     * after a proposal has finished (Succeeded or Defeated).
     */
    function reclaimUnspentFees(uint256 id) external {
        Proposal storage prop = proposals[id];

        if (msg.sender != prop.proposer) revert NotProposer();
        if (prop.state != State.Succeeded && prop.state != State.Defeated) {
            revert ProposalNotFinished();
        }

        uint256 amount = prop.unspentGasFees;
        if (amount == 0) revert NoFeesToReclaim();

        // Follow checks-effects-interactions pattern
        prop.unspentGasFees = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Fee reclaim failed");

        emit FeesReclaimed(id, msg.sender, amount);
    }

    /**
     * @notice Owner can update the gas refund amount for *future* proposals.
     */
    function setGasRefundAmount(uint256 _newAmount) external {
        require(msg.sender == owner, "Only owner");
        gasRefundAmount = _newAmount;
        emit GasRefundAmountUpdated(_newAmount);
    }

    // --- View Functions ---

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
        bool feesSponsoredByProposer,
        uint256 gasPerVote,
        uint256 unspentGasFees // Added
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
            prop.feesSponsoredByProposer,
            prop.gasPerVote,
            prop.unspentGasFees // Added
        );
    }

    function getJurors(uint256 id) external view returns (address[] memory) {
        return jurors[id];
    }

    /// @notice Get current Pyth Entropy fee (changes dynamically)
    /// @return Current entropy fee in wei
    function getEntropyFee() external view returns (uint256) {
        return entropy.getFee(entropyProvider);
    }

    receive() external payable {}
}