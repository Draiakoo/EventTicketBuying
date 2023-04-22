const {network, ethers} = require("hardhat");
const {networkConfig, developmentChains} = require("../helper-hardhat-config");
const {verify} = require("../utils/verify");

module.exports = async ({getNamedAccounts, deployments}) =>{
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId;

    console.log("----------------------------------------------------");
    const arguments = [
        networkConfig[chainId]["eventCreationFee"],
        networkConfig[chainId]["ticketBuyingFee"]
    ]

    let ticketSeller = await deploy("TicketDistributor", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: 1
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(ticketSeller.address, arguments)
    }

}

module.exports.tags = ["all", "ticketDistributor"]