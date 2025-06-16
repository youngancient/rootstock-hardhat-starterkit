import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployments, getNamedAccounts } = hre;
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();

	await deploy("CrowdFundingFactory", {
		from: deployer,
		args: [], // No constructor args
		log: true,
	});
};

export default func;
func.tags = ["factory"];
