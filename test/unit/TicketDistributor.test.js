const {assert, expect} = require("chai");
const {network, deployments, ethers} = require("hardhat");
const {developmentChains, networkConfig} = require("../../helper-hardhat-config");


!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Ticket Distributor Tests", function () {
        let ticketSeller, ticketSellerContract, eventCreationFee, ticketBuyingFee, buyer1, buyer2, buyer3, deployer;

        beforeEach(async () => {
            accounts = await ethers.getSigners();
            deployer = accounts[0];
            buyer1 = accounts[1];
            buyer2 = accounts[2];
            buyer3 = accounts[3];
            ticketBuyingFee = networkConfig[network.config.chainId].ticketBuyingFee;
            eventCreationFee = networkConfig[network.config.chainId].eventCreationFee;
            await deployments.fixture(["ticketDistributor"]);
            ticketSeller = await ethers.getContract("TicketDistributor");
        })

        describe("Constructor", function () {
            it("constructor event creation fee entered correctly", async ()=> {
                const eventCreationFeeInitialized = await ticketSeller.i_eventCreationFee();
                assert.equal(eventCreationFeeInitialized.toString(), eventCreationFee);
            })

            it("constructor ticket buying fee entered correctly", async ()=> {
                const ticketBuyingFeeInitialized = await ticketSeller.i_ticketBuyingFee();
                assert.equal(ticketBuyingFeeInitialized.toString(), ticketBuyingFee);
            })
        })

        describe("Event creation", function () {
            it("deployer creates an event", async ()=> {
                deployerConnection = ticketSeller.connect(deployer);
                await deployerConnection.createEvent("First event", "150", "5000000000000000000",{value: eventCreationFee});
                const owner = await ticketSeller.s_events(0);
                assert.equal(owner.creator, deployer.address);
            })
            it("deployer creates an event without enough fee ether", async ()=> {
                deployerConnection = ticketSeller.connect(deployer);
                await expect(deployerConnection.createEvent("First event", "150", "5000000000000000000")).to.be.revertedWith("EventCreationFeeNotMatching");
            })
            it("deployer creates an event with more fee ether", async ()=> {
                let valueToCreate = ethers.utils.parseUnits(eventCreationFee,"wei");
                valueToCreate = valueToCreate.add(ethers.utils.parseEther("1"));
                deployerConnection = ticketSeller.connect(deployer);
                await expect(deployerConnection.createEvent("First event", "150", "5000000000000000000",{value: valueToCreate})).to.be.revertedWith("EventCreationFeeNotMatching");
            })
        })

        describe("Finishing event", function() {
            it("not deployer tries to finish an event", async ()=> {
                deployerConnection = ticketSeller.connect(deployer);
                await deployerConnection.createEvent("First event", "150", "5000000000000000000",{value: eventCreationFee});
                const notDeployerConnection = ticketSeller.connect(buyer1);
                await expect(notDeployerConnection.finishEvent("0")).to.be.revertedWith("NotEventCreator");
            })
            it("deployer finished an event", async ()=> {
                deployerConnection = ticketSeller.connect(deployer);
                await deployerConnection.createEvent("First event", "150", "5000000000000000000",{value: eventCreationFee});
                await deployerConnection.finishEvent("0");
                let eventActive = await ticketSeller.s_events(0);
                assert.equal(eventActive.active, false);
            })

        beforeEach(async () => {
            deployerConnection = ticketSeller.connect(deployer);
            const ticketPrice = ethers.utils.parseEther("5");
            await deployerConnection.createEvent("First event", "3", ticketPrice,{value: eventCreationFee});
        })

        describe("Buying tickets", function() {
            it("check if when bought a ticket, the address is updated", async ()=> {
                const ticketPrice = ethers.utils.parseEther("5");
                const valueToSend = ticketPrice.add(ticketBuyingFee);
                const notDeployerConnection = ticketSeller.connect(buyer1);
                await notDeployerConnection.buyTicket("0",{value: valueToSend});
                const assistant = await notDeployerConnection.checkAssistant("0",buyer1.address)
                assert.equal(assistant, true);
            })
            it("revert if the event is not created", async ()=> {
                const ticketPrice = ethers.utils.parseEther("5");
                const valueToSend = ticketPrice.add(ticketBuyingFee);
                const notDeployerConnection = ticketSeller.connect(buyer1);
                await expect(notDeployerConnection.buyTicket("10",{value: valueToSend})).to.be.revertedWith("NonExistingEvent");
            })
            it("revert if the event has been finished", async ()=> {
                deployerConnection = ticketSeller.connect(deployer);
                await deployerConnection.finishEvent("0");
                const ticketPrice = ethers.utils.parseEther("5");
                const valueToSend = ticketPrice.add(ticketBuyingFee);
                const notDeployerConnection = ticketSeller.connect(buyer1);
                await expect(notDeployerConnection.buyTicket("10",{value: valueToSend})).to.be.revertedWith("NonExistingEvent");
            })
            it("revert if someone has already bought a ticket", async ()=> {
                const ticketPrice = ethers.utils.parseEther("5");
                const valueToSend = ticketPrice.add(ticketBuyingFee);
                const notDeployerConnection = ticketSeller.connect(buyer1);
                await notDeployerConnection.buyTicket("0",{value: valueToSend});
                await expect(notDeployerConnection.buyTicket("0",{value: valueToSend})).to.be.revertedWith("AlreadyHaveBoughtTicket");
            })
            it("revert if all tickets have been sold", async ()=> {
                const ticketPrice = ethers.utils.parseEther("5");
                const valueToSend = ticketPrice.add(ticketBuyingFee);

                const buyer1Connection = ticketSeller.connect(buyer1);
                await buyer1Connection.buyTicket("0",{value: valueToSend});
                const buyer2Connection = ticketSeller.connect(buyer2);
                await buyer2Connection.buyTicket("0",{value: valueToSend});
                const buyer3Connection = ticketSeller.connect(buyer3);
                await buyer3Connection.buyTicket("0",{value: valueToSend});

                const deployerConnection = ticketSeller.connect(deployer);
                await expect(deployerConnection.buyTicket("0",{value: valueToSend})).to.be.revertedWith("AllTicketsSold");

            })
            it("revert if the amount funded is not enough for the ticket price plus the ticket fee", async ()=> {
                const ticketPrice = ethers.utils.parseEther("5");

                const deployerConnection = ticketSeller.connect(deployer);
                await expect(deployerConnection.buyTicket("0",{value: ticketPrice})).to.be.revertedWith("AmountFundedNotMatching");
            })
        })
        })
    })