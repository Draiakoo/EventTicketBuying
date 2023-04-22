const networkConfig = {
    11155111: {
        name: "sepolia",
        eventCreationFee: "1000000000000000",
        ticketBuyingFee: "100000000000000"
    },
    31337: {
        name: "hardhat",
        eventCreationFee: "1000000000000000000",
        ticketBuyingFee: "100000000000000000"
    }
}

const developmentChains = ["hardhat", "localhost"]
const DECIMALS = 8
const INITIAL_ANSWER = 200000000000

module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
}