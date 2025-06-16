import { expect } from "chai"
import { deployments, ethers, getNamedAccounts } from "hardhat"

describe("CrowdFunding Contract", function () {
  let setupFixture;

  before(async () => {
    setupFixture = deployments.createFixture(async () => {
      await deployments.fixture();

      const signers = await getNamedAccounts();
      const deployerSigner = await ethers.getSigner(signers.deployer);

      const crowdFundingFactory = await ethers.getContractFactory("CrowdFunding", deployerSigner,[]);
      const contract = await crowdFundingFactory.deploy(signers.deployer);
      await contract.waitForDeployment();

      return {
        contract,
        contractAddress: await contract.getAddress(),
        deployer: signers.deployer,
        deployerSigner,
        accounts: await ethers.getSigners(),
      };
    });
  });

   it("Should set the deployer as the owner", async () => {
    const { contract, deployer } = await setupFixture();
    expect(await contract.owner()).to.equal(deployer);
  });

  it("Should create a new campaign", async () => {
    const { contract, accounts } = await setupFixture();
    const goal = ethers.parseEther("1");
    const deadline = 3600;

    await expect(
      contract.createCampaign("Plant Trees", "Plant 1000 trees", accounts[1].address, goal, deadline)
    ).to.emit(contract, "CampaignCreated");

    const campaign = await contract.idToCampaigns(1);
    expect(campaign.title).to.equal("Plant Trees");
  });

  it("Should reject campaign with zero goal", async () => {
    const { contract, accounts } = await setupFixture();

    await expect(
      contract.createCampaign("ZeroGoal", "Should fail", accounts[1].address, 0, 5000)
    ).to.be.revertedWith("Goal cannot be zero!");
  });

  it("Should allow donations to active campaign", async () => {
    const { contract, accounts } = await setupFixture();
    const goal = ethers.parseEther("1");
    const deadline = 3600;

    await contract.createCampaign("Save Water", "Clean water for all", accounts[1].address, goal, deadline);

    await expect(
      contract.connect(accounts[2]).donateToCampaign(1, { value: ethers.parseEther("0.2") })
    ).to.emit(contract, "DonationReceived");

    const campaign = await contract.idToCampaigns(1);
    expect(campaign.amountRaised).to.equal(ethers.parseEther("0.2"));
  });

  it("Should end the campaign and transfer funds", async () => {
    const { contract, accounts } = await setupFixture();
    const goal = ethers.parseEther("1");
    const deadline = 1000;

    await contract.createCampaign("Build School", "Fund local school", accounts[1].address, goal, deadline);
    await contract.connect(accounts[2]).donateToCampaign(1, { value: ethers.parseEther("1") });

    await ethers.provider.send("evm_increaseTime", [1001]);
    await ethers.provider.send("evm_mine");

    const balanceBefore = await ethers.provider.getBalance(accounts[1].address);

    await expect(contract.connect(accounts[0]).endCampaign(1)).to.emit(contract, "CampaignEnded");

    const balanceAfter = await ethers.provider.getBalance(accounts[1].address);
    expect(balanceAfter).to.be.gt(balanceBefore);
  });
});
