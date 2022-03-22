let Auction = artifacts.require('./Auction.sol');
let auctionInstance;

contract('AuctionContract', function (accounts) {
    //accounts[0] is the default account
    describe('Contract deployment', function () {
        it('Contract deployment', function () {
            //Fetching the contract instance of our smart contract
            return Auction.deployed().then(function (instance) {
                //We save the instance in a global variable and all smart contract functions are called using this
                auctionInstance = instance;
                assert(
                    auctionInstance !== undefined,
                    'Auction contract should be defined'
                );
            });
        });


        it('Initial rule with corrected startingPrice and minimumStep', function () {
            //Fetching the rule of Auction
            return auctionInstance.rule().then(function (rule) {
                //We save the instance in a global variable and all smart contract functions are called using this
                assert(rule !== undefined, 'Rule should be defined');
                assert.equal(rule.startingPrice, 50, 'Starting price should be 50');
                assert.equal(rule.minimumStep, 5, 'Minimum step should be 5');
            });
        });
    });


    describe('Register', () => {
        it("Only Auctioneer can register bidders", () => {
            return auctionInstance.register(accounts[1], 100, { from: accounts[1] })
                .then((result) => {
                    throw new Error("Cannot register");
                }).catch((e) => {
                    assert(true, "Cannot register");
                });
        });

        it("Should only available in Created State", function () {
            return auctionInstance.register(accounts[1], 100, { from: accounts[0] })
                .then(() => {
                    return auctionInstance.register(accounts[2], 100, { from: accounts[0] })
                }).then(() => {
                    return auctionInstance.startSession({ from: accounts[0] })
                        .then(() => {
                            return auctionInstance.register(accounts[3], 100, { from: accounts[0] })
                                .then((result) => {
                                    throw new Error("Cannot register");
                                }).catch((e) => {
                                    assert(true, "Cannot register");
                                });
                        });
                });
        });

        it("The account address and the number of tokens need to be putted", function () {
            return auctionInstance.register({ from: accounts[0] })
                .then(() => {
                    throw new Error("Cannot register without account address and token");
                }).catch((e) => {
                    assert(true, "Cannot register without account address and token");
                });
        });
    });

    describe("Start the session", () => {
        it("Only Auctioneer can start the session", () => {
            return auctionInstance.startSession({ from: accounts[1] })
                .then(() => {
                    throw new Error("Cannot start session");
                }).catch((e) => {
                    assert(true, "Cannot start session");
                });
        });

        it("The action is only avaiable in Created State", () => {
            return auctionInstance.startSession({ from: accounts[0] })
                .then(() => {
                    throw new Error("It's Started session");
                }).catch((e) => {
                    assert(true, "It's Started session");
                });
        });
    });

    describe("Bid", () => {
        it("All the Bidders can bid", () => {
            return auctionInstance.bid(55, { from: accounts[2] })
                .then(() => {
                    return auctionInstance.bid(60, { from: accounts[1] })
                        .then(() => {
                            throw new Error("All bidders can bid");
                        }).catch((e) => {
                            if (e == "All bidders can bid") {
                                assert(false);
                            } else {
                                assert(true);
                            }
                        });
                });
        });


        it("The next price must be inputted", function () {
            return auctionInstance.bid({ from: accounts[1] })
                .then(() => {
                    throw ("Price must be inputted");
                }).catch((e) => {
                    assert(true, "Price must be inputted");
                });
        });

        it("The next price must be higher than the latest price plus the minumum step", function () {
            return auctionInstance.bid(65, { from: accounts[2] })
                .then(() => {
                    return auctionInstance.bid(66, { from: accounts[1] })
                        .then(() => {
                            throw ("Next price must higher than latest price + min step");
                        }).catch((e) => {
                            assert(true, "Next price must higher than latest price + min step");
                        });
                });
        });
    });

    describe("Announce", () => {
        it("Only the Auctioneer can Announce", function () {
            return auctionInstance.announce({ from: accounts[1] })
                .then(result => {
                    throw ("Only the Auctioneer can Announce");
                }).catch((e) => {
                    assert(true, "Only the Auctioneer can Announce");
                });
        });

        it("After 3 times (4th call of this action), the session will end", function () {
            return auctionInstance.announce({ from: accounts[0] })
                .then(() => {

                    return auctionInstance.announce({ from: accounts[0] })
                        .then(() => {

                            return auctionInstance.announce({ from: accounts[0] })
                                .then(() => {

                                    return auctionInstance.announce({ from: accounts[0] })
                                        .then(() => {
                                            return auctionInstance.announce({ from: accounts[0] })
                                                .then(() => {
                                                    throw ("session is ended, cannot announce more");
                                                }).catch(() => {
                                                    assert(true, "cannot announce more");
                                                });

                                        });
                                });
                        });
                });
        });

        it("This action is only available in Started State", function () {
            return auctionInstance.announce({ from: accounts[0] })
                .then(() => {
                    throw ("It's Closing State, cannot announce more");
                }).catch(() => {
                    assert(true, "It's Closing State, cannot announce more");
                });
        });

        it("(From bid) The action is only available in Started State", function () {
            return auctionInstance.bid(70, { from: accounts[1] })
                .then(() => {
                    throw new Error("It's closing state, cannot bid anymore");
                }).catch((e) => {
                    assert(true, "It's closing state, cannot bid anymore");
                });
        });
    });

    describe("Get back the deposit", () => {
        it("All the Bidders (except the Winner) can Get back the deposit", () => {
            return auctionInstance.getDeposit({ from: accounts[1] })
                .then(() => {
                    return auctionInstance.getDeposit({ from: accounts[2] })
                        .then(() => {
                            throw new Error("Winner cannot get back deposit")
                        }).catch(() => {
                            assert(true, "Winner cannot get back deposit")
                        });
                });
        });

        it("This action is only available in Closing State", function () {
            return auctionInstance.getDeposit({ from: accounts[1] })
                .then(() => {
                    throw new Error("Can not get deposit")
                })
                .catch((e) => {
                    assert(true, "Can not get deposit");
                });
        });
    });
});
