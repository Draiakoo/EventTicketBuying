// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

contract TicketDistributor {

    /*Errors*/
    error EventCreationFeeNotMatching();
    error NonExistingEvent();
    error AlreadyHaveBoughtTicket();
    error AmountFundedNotMatching();
    error AllTicketsSold();
    error NotEventCreator();
    error NotContractOwner();
    error NotCreatorOfTheEvent();
    error EventStillActive();
    error NoFundsToWithdraw();

    /*Events*/
    event EventCreated(uint256 indexed index, string indexed name);
    event EventFinished(uint256 indexed index, string indexed name);
    event TicketBought(uint256 indexed index, string indexed name, address indexed buyer);
    event OwnerWithdraw(uint256 indexed events, uint256 indexed tickets);
    event EventFundWithdraw(uint256 indexed index, address indexed creator);

    address private immutable i_owner;
    uint256 public immutable i_eventCreationFee;
    uint256 public immutable i_ticketBuyingFee;
    uint256 public s_eventsCreated = 0;
    uint256 public s_ticketsBought = 0;
    uint256 private s_index = 0;
    mapping(uint256 => Event) public s_events;

    struct Event {
        address creator;
        string name;
        uint256 totalTicketAmount;
        uint256 ticketsSold;
        uint256 ticketPrice;
        mapping(address => bool) assistants;
        bool active;
    }

    constructor(uint256 _eventCreationFee, uint256 _ticketBuyingFee) {
        i_owner = msg.sender;
        i_eventCreationFee = _eventCreationFee;
        i_ticketBuyingFee = _ticketBuyingFee;
    }

    modifier onlyOwner() {
        if(msg.sender!=i_owner) {
            revert NotContractOwner();
        }
        _;
    }

    function withdrawOwnerFunds() public onlyOwner() {
        uint256 totalFund = (s_eventsCreated * i_eventCreationFee) + (s_ticketsBought * i_ticketBuyingFee);
        (bool success, ) = i_owner.call{value: totalFund}("");
        require(success);
        emit OwnerWithdraw(s_eventsCreated, s_ticketsBought);
        s_eventsCreated = 0;
        s_ticketsBought = 0;
    }

    function withdrawEventFunds(uint256 _index) public {
        if(msg.sender!=s_events[_index].creator){
            revert NotCreatorOfTheEvent();
        }
        if(s_events[_index].active==true){
            revert EventStillActive();
        }
        if(s_events[_index].ticketsSold==0){
            revert NoFundsToWithdraw();
        }
        uint256 totalFund = s_events[_index].ticketsSold * s_events[_index].ticketPrice;
        (bool success, ) = i_owner.call{value: totalFund}("");
        require(success);
        s_events[_index].ticketsSold = 0;
        emit EventFundWithdraw(_index, msg.sender);
    }

    function createEvent(string memory _name, uint256 _totalTicketAmount, uint256 _ticketPrice) public payable {
        if(msg.value!=i_eventCreationFee){
            revert EventCreationFeeNotMatching();
        }
        Event storage new_event = s_events[s_index];
        s_index++;
        new_event.creator = msg.sender;
        new_event.name = _name;
        new_event.totalTicketAmount = _totalTicketAmount;
        new_event.ticketsSold = 0;
        new_event.ticketPrice = _ticketPrice;
        new_event.active = true;
        s_eventsCreated++;
        emit EventCreated(s_index-1, _name);
    }

    function finishEvent(uint256 _index) public{
        if(s_events[_index].creator!=msg.sender){
            revert NotEventCreator();
        }
        s_events[_index].active = false;
        emit EventFinished(_index, s_events[_index].name);
    }

    function buyTicket(uint256 _index) public payable {
        if(!s_events[_index].active){
            revert NonExistingEvent();
        }
        if(s_events[_index].assistants[msg.sender]){
            revert AlreadyHaveBoughtTicket();
        }
        if(s_events[_index].totalTicketAmount<=s_events[_index].ticketsSold){
            revert AllTicketsSold();
        }
        if(msg.value!=(i_ticketBuyingFee+s_events[_index].ticketPrice)){
            revert AmountFundedNotMatching();
        }
        s_events[_index].ticketsSold++;
        s_events[_index].assistants[msg.sender] = true;
        s_ticketsBought++;
        emit TicketBought(_index, s_events[_index].name, msg.sender);
    }

    function checkAssistant(uint256 _index, address _assistant) public view returns(bool){
        return s_events[_index].assistants[_assistant];
    }
}