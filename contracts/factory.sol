// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CrowdFunding} from "./crowdfund.sol"; 

contract CrowdFundingFactory {
    address public factoryOwner;
    address[] public deployedCampaigns;

    event CampaignDeployed(address indexed campaignAddress, address indexed creator, uint256 timestamp);

    constructor() {
        factoryOwner = msg.sender;
    }

    function createCrowdFundingCampaign(address _owner) external returns (address) {
        CrowdFunding newCampaign = new CrowdFunding(_owner);
        deployedCampaigns.push(address(newCampaign));

        emit CampaignDeployed(address(newCampaign), msg.sender, block.timestamp);

        return address(newCampaign);
    }

    function getAllDeployedCampaigns() external view returns (address[] memory) {
        return deployedCampaigns;
    }

    function getCampaignCount() external view returns (uint256) {
        return deployedCampaigns.length;
    }
}
