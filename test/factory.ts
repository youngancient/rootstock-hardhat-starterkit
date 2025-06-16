const { ethers, deployments, getNamedAccounts } = require("hardhat");
const { expect } = require("chai");

describe("CrowdFundingFactory", () => {
  const setupFixture = deployments.createFixture(async () => {
    await deployments.fixture();

    const signers = await getNamedAccounts();
    const accounts = await ethers.getSigners();

    const factory = await ethers.deployContract(
      "CrowdFundingFactory",
      [],
      await ethers.getSigner(signers.deployer)
    );

    return {
      factory,
      deployer: signers.deployer,
      accounts,
    };
  });

  it("Should deploy a new CrowdFunding campaign board", async () => {
    const { factory, accounts } = await setupFixture();

    const tx = await factory.createCrowdFundingCampaign(accounts[1].address);
    const receipt = await tx.wait();
    const event = receipt.logs.find((log) =>
      log.fragment.name === "CampaignDeployed"
    );

    const newCampaignAddress = event.args.campaignAddress;

    expect(newCampaignAddress).to.properAddress;

    // Attach contract interface to the deployed address
    const campaignContract = await ethers.getContractAt(
      "CrowdFunding",
      newCampaignAddress
    );

    expect(await campaignContract.owner()).to.equal(accounts[1].address);
  });

  it("Should correctly track all deployed campaign boards", async () => {
    const { factory, accounts } = await setupFixture();

    await factory.createCrowdFundingCampaign(accounts[1].address);
    await factory.createCrowdFundingCampaign(accounts[2].address);

    const campaigns = await factory.getAllDeployedCampaigns();
    expect(campaigns.length).to.equal(2);
  });

  it("Should return the correct count of deployed campaign boards", async () => {
    const { factory, accounts } = await setupFixture();

    await factory.createCrowdFundingCampaign(accounts[1].address);
    await factory.createCrowdFundingCampaign(accounts[2].address);
    await factory.createCrowdFundingCampaign(accounts[3].address);

    const count = await factory.getCampaignCount();
    expect(count).to.equal(3n); // bigint
  });
});
