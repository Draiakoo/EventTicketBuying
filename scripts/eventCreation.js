const { network, ethers, getNamedAccounts } = require("hardhat");
const {developmentChains, networkConfig} = require("../helper-hardhat-config");

async function main() {
  const eventCreationFee = networkConfig[network.config.chainId].eventCreationFee;
  const { deployer } = await getNamedAccounts()
  const ticketSeller = await ethers.getContract("TicketDistributor", deployer)
  const transactionResponse = await ticketSeller.createEvent("First event", "150", "5000000000000000000",{value: eventCreationFee});
  await transactionResponse.wait();
  console.log("Event created!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })