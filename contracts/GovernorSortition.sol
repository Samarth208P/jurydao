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
        uint256 gasPerVote; // Gas fees allocated per juror
    }

    IEntropy public entropy;
    address public entropyProvider;
    IJurorRegistry public registry;
    address public owner;

    uint256 public proposalCount;
    uint256 public constant MIN_VOTING_PERIOD = 1 hours;
    uint256 public constant MAX_VOTING_PERIOD = 30 days;
    uint256 public constant GAS_PER_VOTE = 0.001 ether; // Estimated gas cost per vote

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => address[]) public jurors;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint64 => uint256) public sequenceToProposal;

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

    constructor(address _entropy, address _entropyProvider, address _registry) payable {
        entropy = IEntropy(_entropy);
        entropyProvider = _entropyProvider;
        registry = IJurorRegistry(_registry);
        owner = msg.sender;
    }

    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _jurySize,
        uint256 _votingPeriodSeconds,
        bool _sponsorFees
    ) external payable returns (uint256) {
        require(bytes(_title).length > 0, "Title required");
        require(bytes(_description).length > 0, "Description required");
        require(_jurySize > 0, "Jury size must be > 0");
        require(_jurySize <= registry.getJurorCount(), "Jury size exceeds available jurors");
        require(_votingPeriodSeconds >= MIN_VOTING_PERIOD, "Voting period too short");
        require(_votingPeriodSeconds <= MAX_VOTING_PERIOD, "Voting period too long");

        uint256 totalGasCost = _jurySize * GAS_PER_VOTE;

        if (_sponsorFees) {
            require(msg.value >= totalGasCost, "Insufficient gas fees sent");
        }

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
            gasPerVote: GAS_PER_VOTE
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

        // Request randomness from Pyth Entropy
        uint256 fee = entropy.getFee(entropyProvider);
        require(address(this).balance >= fee, "Insufficient entropy fee");

        bytes32 userRandomNumber = keccak256(abi.encodePacked(
            block.timestamp,
            msg.sender,
            proposalId
        ));

        uint64 sequenceNumber = entropy.requestWithCallback{value: fee}(
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

        require(prop.state == State.Pending, "Invalid state");

        uint256 totalJurors = registry.getJurorCount();
        require(totalJurors >= prop.jurySize, "Not enough jurors");

        address[] memory selectedJurors = new address[](prop.jurySize);
        uint256 selected = 0;

        uint256 randomSeed = uint256(randomNumber);

        for (uint256 i = 0; i < totalJurors && selected < prop.jurySize; i++) {
            uint256 randomIndex = (randomSeed + i) % totalJurors;
            address juror = registry.getJurorAtIndex(randomIndex);

            bool alreadySelected = false;
            for (uint256 j = 0; j < selected; j++) {
                if (selectedJurors[j] == juror) {
                    alreadySelected = true;
                    break;
                }
            }

            if (!alreadySelected) {
                selectedJurors[selected] = juror;
                selected++;
            }
        }

        jurors[proposalId] = selectedJurors;
        prop.state = State.Active;

        emit JurorsSelected(proposalId, selectedJurors);
    }

    function vote(uint256 id, bool support) external {
        Proposal storage prop = proposals[id];

        require(prop.state == State.Active, "Not active");
        require(block.timestamp < prop.deadline, "Voting ended");
        require(!hasVoted[id][msg.sender], "Already voted");

        bool isSelectedJuror = false;
        for (uint256 i = 0; i < jurors[id].length; i++) {
            if (jurors[id][i] == msg.sender) {
                isSelectedJuror = true;
                break;
            }
        }
        require(isSelectedJuror, "Not a selected juror");

        hasVoted[id][msg.sender] = true;

        if (support) {
            prop.forVotes++;
        } else {
            prop.againstVotes++;
        }

        emit Voted(id, msg.sender, support);

        // Refund gas if sponsored by proposer
        if (prop.feesSponsoredByProposer && prop.gasPerVote > 0) {
            (bool success, ) = msg.sender.call{value: prop.gasPerVote}("");
            if (success) {
                emit GasRefunded(id, msg.sender, prop.gasPerVote);
            }
        }

        // Auto-execute if all jurors voted
        uint256 totalVotes = prop.forVotes + prop.againstVotes;
        if (totalVotes >= prop.jurySize) {
            _executeProposal(id);
        }
    }

    function execute(uint256 id) external {
        Proposal storage prop = proposals[id];
        require(prop.state == State.Active, "Not active");

        uint256 totalVotes = prop.forVotes + prop.againstVotes;
        require(
            block.timestamp >= prop.deadline || totalVotes >= prop.jurySize,
            "Voting not ended"
        );

        _executeProposal(id);
    }

    function _executeProposal(uint256 id) private {
        Proposal storage prop = proposals[id];

        if (prop.forVotes > prop.againstVotes) {
            prop.state = State.Succeeded;
        } else {
            prop.state = State.Defeated;
        }

        emit Executed(id, prop.state);
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
        bool feesSponsoredByProposer,
        uint256 gasPerVote
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
            prop.gasPerVote
        );
    }

    function getJurors(uint256 id) external view returns (address[] memory) {
        return jurors[id];
    }

    function getRequiredFee(uint256 _jurySize) external pure returns (uint256) {
        return _jurySize * GAS_PER_VOTE;
    }

    receive() external payable {}
}
