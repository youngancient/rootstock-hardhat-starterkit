import { ethers } from "hardhat"

async function main() {
	const FACTORY_CONTRACT_ADDRESS = "0x3a1D9EE253C6301f2b75941A23a356C7eD4a66DC".toLowerCase();
	const factoryABI = [
		"function factoryOwner() view returns (address)",
		"function deployedCampaigns(uint256) view returns (address)",
		"function createCrowdFundingCampaign(address _owner) returns (address)",
		"function getAllDeployedCampaigns() view returns (address[])",
		"function getCampaignCount() view returns (uint256)",
	]

	const [signer] = await ethers.getSigners()

	const factory = await ethers.getContractAt(factoryABI, FACTORY_CONTRACT_ADDRESS)

	const crowdfundABI = [
		"function owner() view returns (address)",
		"function counter() view returns (uint256)",
		"function doesCampaignExist(uint256 _id) view returns (bool)",
		"function doesUserCampaignExist(address _userAddress) view returns (bool)",
		"function hasCampaignDeadlineReached(uint256 _id) view returns (bool)",
		"function getAllUsersCampaigns() view returns (tuple(uint id, string title, string description, address benefactor, uint noOfDonations, uint goal, uint deadline, uint amountRaised, uint timeCreated, bool isEnded)[])",
		"function createCampaign(string _title, string _description, address _benefactor, uint _goal, uint _deadline)",
		"function donateToCampaign(uint256 _id) payable",
		"function endCampaign(uint256 _id)",
		"function idToCampaigns(uint256) view returns (uint id, string title, string description, address benefactor, uint noOfDonations, uint goal, uint deadline, uint amountRaised, uint timeCreated, bool isEnded)",
		"function benefactorToCampaignIdMap(address) view returns (uint256[])",
	]
    const count5 = await factory.getCampaignCount()
    console.log(`\nTotal Campaign Contracts Deployed: ${count5}`)

    // Create multiple campaign contracts
	console.log("Creating campaigns...")
	for (let i = 0; i < 2; i++) {
		const tx = await factory.createCrowdFundingCampaign(signer.address)
		const receipt = await tx.wait()
		const newAddress = receipt.logs[0].address
		console.log(`Campaign Board ${i + 1} deployed at: ${newAddress}`)
	}

	// Check count and deployed addresses
	const count = await factory.getCampaignCount()
	const deployedCampaigns = await factory.getAllDeployedCampaigns()
	console.log(`\nTotal Campaign Contracts Deployed: ${count}`)
	console.log("All deployed campaign board addresses:")
	deployedCampaigns.forEach((addr: string, i: number) =>
		console.log(`  ${i + 1}. ${addr}`)
	)

	// Pick one of the campaigns to interact with
	const selectedCampaignAddress = deployedCampaigns[0]
	console.log(`\nInteracting with campaign at ${selectedCampaignAddress}...\n`)
	const campaignBoard = new ethers.Contract(selectedCampaignAddress, crowdfundABI, signer)

	// Create a campaign inside the contract
	const goal = ethers.parseEther("1")
	const deadlineInSeconds = 60 * 60 * 24 // 1 day
	const createTx = await campaignBoard.createCampaign(
		"Clean Water Drive",
		"Provide clean water to remote villages",
		signer.address,
		goal,
		deadlineInSeconds
	)
	await createTx.wait()
	console.log("Campaign created inside the campaign contract.")

	// Donate to the campaign
	const donateTx = await campaignBoard.donateToCampaign(1, {
		value: ethers.parseEther("0.0000001")
	})
	await donateTx.wait()
	console.log("Donated 0.0000001 ETH to campaign ID 1.")

	// List campaigns stored
	const campaigns = await campaignBoard.getAllUsersCampaigns()
	console.log("\nCampaigns stored in the campaign contract:")
	campaigns.forEach((c: any) => {
		console.log(`- [${c.id}] ${c.title} | Raised: ${ethers.formatEther(c.amountRaised)} ETH | Ended: ${c.isEnded}`)
	})
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
