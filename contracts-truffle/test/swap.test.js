
const MoroccoSwapV2Pair = artifacts.require('MoroccoSwapV2Pair');
const MoroccoSwapV2Factory = artifacts.require('MoroccoSwapV2Factory');
const MoroccoSwapV2Router02 = artifacts.require('MoroccoSwapV2Router02');
const ERC20Mock = artifacts.require('ERC20Mock');
const WETH9Mock = artifacts.require('WETH9Mock');

const { time, constants } = require('@openzeppelin/test-helpers');

const ANTIBank = artifacts.require('MoroccoANTIXBank');
const ETHXBank = artifacts.require('MoroccoETHXBank');
const GoldXBank = artifacts.require('MoroccoGoldXBank');
const BTCXBank = artifacts.require('MoroccoBTCXBank');
const USDTXBank = artifacts.require('MoroccoUSDTXBank');

const MoroccoSwapFeeTransfer = artifacts.require('MoroccoSwapFeeTransfer');
const Roulette = artifacts.require('Roulette');

const MoroccoSwapFarm = artifacts.require('MoroccoSwapFarm');



contract("swap", function (accounts) {
  const alice = accounts[0];
  const bob = accounts[1];
  const minter = accounts[2];
  const elon = accounts[3];
  const stakeOwner = accounts[4];
  const admin = accounts[5];
  const global = accounts[6];
  const user1 = accounts[7];
  const user2 = accounts[8];
  const carol = accounts[9];

  before(async () => {
    //tokens
    this.antiToken = await ERC20Mock.new({ from: bob });
    this.usdtxToken = await ERC20Mock.new({ from: bob });
    this.goldxToken = await ERC20Mock.new({ from: bob });
    this.btcxToken = await ERC20Mock.new({ from: bob });
    this.ethxToken = await ERC20Mock.new({ from: bob });

    // bank contracts
    this.antiBank = await ANTIBank.new(this.antiToken.address)
    this.usdtxBank = await USDTXBank.new(this.usdtxToken.address)
    this.goldxBank = await GoldXBank.new(this.goldxToken.address)
    this.btcxBank = await BTCXBank.new(this.btcxToken.address)
    this.ethxBank = await ETHXBank.new(this.ethxToken.address)

    // roulette contract
    this.roulette = await Roulette.new(this.antiToken.address);
    // swap contracts
    this.weth = await WETH9Mock.new(18, { from: alice });
    this.factory = await MoroccoSwapV2Factory.new(alice, { from: alice });
    console.log("factory", (await this.factory.pairCodeHash()).toString());
    this.router = await MoroccoSwapV2Router02.new(this.factory.address, this.weth.address);

    await this.factory.setRouter(this.router.address);

    this.feeTransfer = await MoroccoSwapFeeTransfer.new(this.factory.address, this.router.address, alice);
    this.factory.setFeeTransfer(this.feeTransfer.address)

    // farm
    this.farm = await MoroccoSwapFarm.new(this.factory.address, alice)

    // initial configuration

    await this.feeTransfer.configure(
      this.roulette.address,
      this.farm.address,
      [this.antiBank.address, this.usdtxBank.address, this.goldxBank.address, this.btcxBank.address, this.ethxBank.address],
      bob,
      bob,
      bob,
      bob,
      bob,
      bob)

  });




  it('add antiToken - usdtxToken liquidity successfully', async () => {

    await this.antiToken.mint(carol, web3.utils.toWei('2000'), { from: carol })
    await this.antiToken.approve(this.router.address, web3.utils.toWei('1000'), { from: carol })

    await this.usdtxToken.mint(carol, web3.utils.toWei('2000'), { from: carol })
    await this.usdtxToken.approve(this.router.address, web3.utils.toWei('1000'), { from: carol })

    // await this.factory.pauseFee(true);
    await this.router.addLiquidity(this.antiToken.address, this.usdtxToken.address, web3.utils.toWei('1000'), web3.utils.toWei('100'),
      0, 0, carol, Number(await time.latest()) + 123, { from: carol })
  
})




})

// ganache-cli -a 1000 --gasLimit '99721975' --gasPrice '0' --allowUnlimitedContractSize -e=1000

// truffle test ./test/swap.test.js --compile-none network development --show-events
