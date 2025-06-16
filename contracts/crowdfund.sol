// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CrowdFunding {
    address public owner;

    uint256 public counter;

    constructor(address _owner) {
        owner = _owner;
    }

    // campaign struct
    // the title must be unique and hence is a key
    struct Campaign {
        uint id;
        string title;
        string description;
        address payable benefactor;
        uint noOfDonations;
        uint goal;
        uint deadline;
        uint amountRaised;
        uint timeCreated;
        bool isEnded;
    }

    Campaign[] allCampaigns;

    // campaign id -> campaign struct mapping
    mapping(uint256 => Campaign) public idToCampaigns;
    // benefactor -> campaign id mapping, a user can have multiple campaigns
    mapping(address => uint256[]) public benefactorToCampaignIdMap;

    // events
    event CampaignCreated(
        uint256 indexed id,
        address indexed benefactor,
        string indexed campaignName,
        uint256 amountRaised,
        uint256 endTime
    );
    event DonationReceived(
        address indexed giver,
        uint256 indexed id,
        uint256 indexed amountSent
    );
    event CampaignEnded(
        address indexed owner,
        uint256 indexed id,
        uint256 indexed amountWithdrawn,
        uint256 endTime
    );

    // modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized!");
        _;
    }

    // Useful modular functions

    // checks if campaign with _id exists
    function doesCampaignExist(uint256 _id) public view returns (bool) {
        return idToCampaigns[_id].id > 0;
    }

    // checks if a user has created the same campaign and is active
    function doesUserCampaignExist(
        address _userAddress
    ) public view returns (bool) {
        return benefactorToCampaignIdMap[_userAddress].length > 0;
    }

    // checks if campaign deadline based on name has ended
    function hasCampaignDeadlineReached(
        uint256 _id
    ) public view returns (bool) {
        return idToCampaigns[_id].deadline <= block.timestamp;
        // returns true if the deadline has reached
    }

    function getAllUsersCampaigns() external view returns (Campaign[] memory) {
        return allCampaigns;
    }

    // Core functions
    function createCampaign(
        string memory _title,
        string memory _description,
        address _benefactor,
        uint _goal,
        uint _deadline
    ) public {
        // require campaign exists
        uint256 _id = counter + 1;
        // require that a user has not created such campaign

        // require that the goal is greater than 0
        require(_goal > 0, "Goal cannot be zero!");

        Campaign memory newCampaign = Campaign(
            _id,
            _title,
            _description,
            payable(_benefactor),
            0,
            _goal,
            _deadline + block.timestamp,
            0,
            block.timestamp,
            false
        );
        idToCampaigns[_id] = newCampaign;
        benefactorToCampaignIdMap[_benefactor].push(_id);
        allCampaigns.push(newCampaign);
        counter++; // increment the counter

        emit CampaignCreated(
            _id,
            _benefactor,
            _title,
            _goal,
            _deadline + block.timestamp
        );
    }

    // depositing to contract
    function donateToCampaign(uint256 _id) public payable {
        require(doesCampaignExist(_id), "Campaign does not exist!");

        require(
            !hasCampaignDeadlineReached(_id),
            "Campaign has ended already!"
        );

        // require(!checkCampaignDeadline(_campaignName), "Campaign has ended already!");
        require(msg.value > 0, "Cannot send zero Wei!");
        // if the campaign exists and has not ended
        Campaign storage campaign = idToCampaigns[_id]; // gets campaign from storage

        require(!campaign.isEnded, "Campaign has ended already!");

        campaign.amountRaised = campaign.amountRaised + msg.value;
        campaign.noOfDonations = campaign.noOfDonations + 1;

        emit DonationReceived(msg.sender, _id, msg.value);
    }

    // ends campaign is the deadline is reached
    function endCampaign(uint256 _id) public {
        require(doesCampaignExist(_id), "Campaign does not exist!");
        // access the campaign from storage
        Campaign storage campaign = idToCampaigns[_id];
        // check if the campaign deadline has reached and the campaign deadline boolean isnt true

        require(!campaign.isEnded, "Campaign has ended already!");

        campaign.isEnded = true; // this prevents re-entracy

        uint256 _amount = campaign.amountRaised;
        if (_amount != 0) {
            // calculate the amount to be paid
            (bool success, ) = campaign.benefactor.call{
                value: _amount
            }("");
            require(success, "Campaign money Transfer Failed!");
        }

        emit CampaignEnded(
            campaign.benefactor,
            _id,
            _amount,
            campaign.deadline
        );
    }
}