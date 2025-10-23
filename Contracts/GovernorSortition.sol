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
    }

    IEntropy public entropy;
    address public entropyProvider;
    IJurorRegistry public registry;
    address public owner;

    uint256 public proposalCount;
    uint256 public constant VOTING_PERIOD = 7 days;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => address[]) public jurors;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint64 => uint256) public seqToId;

    event Created(uint256 indexed id, string title, uint64 seq);
    event Selected(uint256 indexed id, uint256 jurySize);
    event Voted(uint256 indexed id, address indexed voter, bool support);
    event Executed(uint256 indexed id, State result);
    event Withdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _entropy, address _provider, address _registry) {
        entropy = IEntropy(_entropy);
        entropyProvider = _provider;
        registry = IJurorRegistry(_registry);
        owner = msg.sender;
    }

    function propose(string memory title, string memory description, uint256 jurySize)
    external payable returns (uint256) {

        uint256 jurorCount = registry.getJurorCount();
        require(jurorCount > 0, "No jurors registered");

        // Auto-adjust jury size
        if (jurySize > jurorCount) {
            jurySize = jurorCount;
        }
        if (jurySize == 0) {
            jurySize = 1;
        }

        uint256 id = proposalCount++;

        proposals[id] = Proposal({
            title: title,
            description: description,
            proposer: msg.sender,
            forVotes: 0,
            againstVotes: 0,
            deadline: 0,
            state: State.Pending,
            jurySize: jurySize
        });

        // Get Pyth Entropy fee and require exact payment
        uint256 fee = entropy.getFee(entropyProvider);
        require(msg.value >= fee, "Insufficient fee for randomness");

        // Request randomness - fee is paid from msg.value
        uint64 seq = entropy.requestWithCallback{value: fee}(
            entropyProvider,
            keccak256(abi.encodePacked(id, block.timestamp))
        );

        seqToId[seq] = id;
        emit Created(id, title, seq);

        // Refund excess payment
        if (msg.value > fee) {
            payable(msg.sender).transfer(msg.value - fee);
        }

        return id;
    }

    function entropyCallback(
        uint64 seq,
        address,
        bytes32 randomNumber
    ) internal override {
        uint256 id = seqToId[seq];
        Proposal storage prop = proposals[id];

        require(prop.state == State.Pending, "Already processed");

        uint256 totalJurors = registry.getJurorCount();
        require(totalJurors > 0, "No jurors available");

        uint256 actualJurySize = prop.jurySize;
        if (actualJurySize > totalJurors) {
            actualJurySize = totalJurors;
        }

        // Select random jurors
        for (uint256 i = 0; i < actualJurySize; i++) {
            uint256 randomIndex = uint256(keccak256(abi.encodePacked(randomNumber, i))) % totalJurors;
            address juror = registry.getJurorAtIndex(randomIndex);
            jurors[id].push(juror);
        }

        prop.state = State.Active;
        prop.deadline = uint64(block.timestamp + VOTING_PERIOD);

        emit Selected(id, actualJurySize);
    }

    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }

    function vote(uint256 id, bool support) external {
        Proposal storage prop = proposals[id];

        require(prop.state == State.Active, "Not active");
        require(block.timestamp < prop.deadline, "Voting ended");
        require(!hasVoted[id][msg.sender], "Already voted");

        // Check if sender is selected juror
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
    }

    function execute(uint256 id) external {
        Proposal storage prop = proposals[id];

        require(prop.state == State.Active, "Not active");
        require(block.timestamp >= prop.deadline, "Voting not ended");

        if (prop.forVotes > prop.againstVotes) {
            prop.state = State.Succeeded;
        } else {
            prop.state = State.Defeated;
        }

        emit Executed(id, prop.state);
    }

    // Withdraw accumulated excess fees (from user overpayments)
    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner).transfer(amount);
        emit Withdrawn(owner, amount);
    }

    function withdrawAll() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        payable(owner).transfer(balance);
        emit Withdrawn(owner, balance);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    function getProposal(uint256 id) external view returns (
        string memory title,
        string memory description,
        address proposer,
        uint256 forVotes,
        uint256 againstVotes,
        uint64 deadline,
        State state,
        uint256 jurySize
    ) {
        Proposal memory p = proposals[id];
        return (p.title, p.description, p.proposer, p.forVotes, p.againstVotes, p.deadline, p.state, p.jurySize);
    }

    function getJurors(uint256 id) external view returns (address[] memory) {
        return jurors[id];
    }

    receive() external payable {}
}
