const { expect } = require("chai");
const { ethers } = require("hardhat");

const { delay, fromBigNum, toBigNum } = require("./utils.js")

// deploy switch
var isDeploy = false;
var addrArr = {
	factory: "0x6fde536efd221478d75afbbf08f53e0747037676",
	router: "0x06C5071F7cF46866ADB3D9f18DDC3DAbb9d7a3eD",
	transfer: "0xd4D14d6C6BC6Da244b23C5b286012Ddedd269fa1",
	farm: "0x2487851FfB26a9dBf42AB935B1312e33d4142f3E",
	roulette: "0x78CbF83EC788F2C17001eCCf21F5CBAa31cEA7e9"
};

// userWallets
var owner;
var userWallet;

//contracts
var wETH = { address: "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83" },
	exchangeFactory,
	exchangeRouter,
	farm,
	moroccoSwapFeeTransfer,
	sharkToken,
	babyToken;

describe("Create UserWallet", function () {
	it("Create account", async function () {
		[owner] = await ethers.getSigners();

		userWallet = ethers.Wallet.createRandom();
		userWallet = userWallet.connect(ethers.provider);
		// var tx = await owner.sendTransaction({
		// 	to: userWallet.address,
		// 	value: ethers.utils.parseUnits("100", 18)
		// });
		// await tx.wait();
	});
});

describe("Exchange deploy and deploy", function () {

	it("Factory deploy", async function () {
		const Factory = await ethers.getContractFactory("MoroccoSwapV2Factory");
		if (isDeploy) {
			exchangeFactory = await Factory.deploy(owner.address);
			await exchangeFactory.deployed();
			console.log("initCodeHash", await exchangeFactory.INIT_CODE_PAIR_HASH());
		} else {
			exchangeFactory = await Factory.attach(addrArr.factory);
		}
		console.log("ExchangeFactory", exchangeFactory.address);
	});

	// it("WETH deploy", async function () {
	// 	const WETH = await ethers.getContractFactory("WETH9Mock");
	// 	wETH = await WETH.deploy();
	// 	await wETH.deployed();
	// });

	it("Router deploy", async function () {
		const Router = await ethers.getContractFactory("MoroccoSwapV2Router02");
		if (isDeploy) {
			exchangeRouter = await Router.deploy(exchangeFactory.address, wETH.address);
			await exchangeRouter.deployed();	
		} else {
			exchangeRouter = await Router.attach(addrArr.router);
		}
		console.log("ExchangeRouter", exchangeRouter.address);
	});

	it("Farm deploy", async function () {
		const MoroccoSwapFeeTransfer = await ethers.getContractFactory("MoroccoSwapFeeTransfer");
		if (isDeploy) {
			moroccoSwapFeeTransfer = await MoroccoSwapFeeTransfer.deploy(exchangeFactory.address, exchangeRouter.address, owner.address);
			await moroccoSwapFeeTransfer.deployed();	
		} else {
			moroccoSwapFeeTransfer = await MoroccoSwapFeeTransfer.attach(addrArr.transfer);
		}
		console.log("moroccoSwapFeeTransfer", moroccoSwapFeeTransfer.address);

		const Farm = await ethers.getContractFactory("MoroccoSwapFarm");
		if (isDeploy) {
			farm = await Farm.deploy(exchangeFactory.address, owner.address);
			await farm.deployed();	
		} else {
			farm = await Farm.attach(addrArr.farm);
		}
		console.log("Farm", farm.address);

		/*-------  Config -------*/
		const ERC20TOKEN = await ethers.getContractFactory("ERC20Mock");

		// Use of token addresses deployed from owners 
		var antiToken = { address: "0xBC71a52Ee97645E2d1a6125a4E3a56450073AE20" };
		var usdtxToken = { address: "0xe671Eebfc576f6eFC5e79Fb96f014294AE571c79" };
		var goldxToken = { address: "0x78C4325E917960C06C9a9f401f1707FA3265F20E" };
		var btcxToken = { address: "0x3f8b2756a41b934b3bcf92d8d77a5596ff0de78b" };
		var ethxToken = { address: "0xCe81AF61E7e7BD0C6a76f96008EDD5EcEa710CF0" };

		// Token deploy
		var Roulette = await ethers.getContractFactory("Roulette");
		if (isDeploy) {
			var roulette = await Roulette.deploy(antiToken.address);
			await roulette.deployed();
		} else {
			var roulette = await Roulette.attach(addrArr.roulette);
		}
		console.log("Roulette", roulette.address);

		var MoroccoANTIXBank = await ethers.getContractFactory("MoroccoANTIXBank");
		var MoroccoUSDTXBank = await ethers.getContractFactory("MoroccoUSDTXBank");
		var MoroccoGoldXBank = await ethers.getContractFactory("MoroccoGoldXBank");
		var MoroccoBTCXBank = await ethers.getContractFactory("MoroccoBTCXBank");
		var MoroccoETHXBank = await ethers.getContractFactory("MoroccoETHXBank");

		var moroccoANTIXBank =await MoroccoANTIXBank.deploy(antiToken.address);
		await moroccoANTIXBank.deployed();
		console.log("MoroccoANTIXBank",moroccoANTIXBank.address);

		var moroccoUSDTXBank = await MoroccoUSDTXBank.deploy(usdtxToken.address);
		await moroccoUSDTXBank.deployed();
		console.log("MoroccoUSDTXBank", moroccoUSDTXBank.address);
		
		var moroccoGoldXBank = await MoroccoGoldXBank.deploy(goldxToken.address);
		await moroccoGoldXBank.deployed();
		console.log("MoroccoGoldXBank", moroccoGoldXBank.address);
		
		var moroccoBTCXBank = await MoroccoBTCXBank.deploy(btcxToken.address);
		await moroccoBTCXBank.deployed();
		console.log("MoroccoBTCXBank", moroccoBTCXBank.address);

		var moroccoETHXBank = await MoroccoETHXBank.deploy(ethxToken.address);
		await moroccoETHXBank.deployed();
		console.log("MoroccoETHXBank", moroccoETHXBank.address);

		var banks = [
			moroccoANTIXBank.address,
			moroccoUSDTXBank.address,
			moroccoGoldXBank.address,
			moroccoBTCXBank.address,
			moroccoETHXBank.address
		];

		testAddress = owner.address;
		var tx = await moroccoSwapFeeTransfer.configure(roulette.address, farm.address, banks, testAddress, testAddress, testAddress, testAddress, testAddress, testAddress);
		await tx.wait();
	});

	it("Set FactoryFeeTransfer", async () => {
		var tx = await exchangeFactory.setFeeTransfer(moroccoSwapFeeTransfer.address);
		await tx.wait();
	});
});

if (!isDeploy) {
	describe("Token contract deploy and AddLiquidity", function () {

		it("SHBY Deploy and Initial", async function () {
			const ERC20TOKEN = await ethers.getContractFactory("ERC20Mock");
			sharkToken = await ERC20TOKEN.deploy();
			await sharkToken.deployed()
	
			babyToken = await ERC20TOKEN.deploy();
			await babyToken.deployed()
		});
	
		it("SHBY AddLiquidity Eth", async function () {
			var tx = await sharkToken.approve(exchangeRouter.address, ethers.utils.parseUnits("100000000", 18));
			await tx.wait();
	
			var tx = await babyToken.approve(exchangeRouter.address, ethers.utils.parseUnits("100000000", 18));
			await tx.wait();
	
			tx = await exchangeRouter.addLiquidityETH(
				sharkToken.address,
				ethers.utils.parseUnits("500000", 18),
				0,
				0,
				owner.address,
				"111111111111111111111",
				{ value: ethers.utils.parseUnits("50", 18) }
			);
			await tx.wait();
		});
	
		it("SHBY AddLiquidity", async function () {
			tx = await exchangeRouter.addLiquidity(
				sharkToken.address,
				babyToken.address,
				ethers.utils.parseUnits("50000", 18),
				ethers.utils.parseUnits("10000", 18),
				0,
				0,
				owner.address,
				"111111111111111111111"
			);
			await tx.wait();
		});
	});
	
	describe("Morocco SwapExact", function () {
	
		it("Morocco Token - Eth", async function () {
			tx = await exchangeRouter.swapExactTokensForETH(
				ethers.utils.parseUnits("5000", 18),
				0,
				[sharkToken.address, wETH.address],
				owner.address,
				"99000000000000000"
			);
			await tx.wait();
		});
	
		it("Morocco Token1 - Token2", async function () {
			tx = await exchangeRouter.swapExactTokensForTokens(
				ethers.utils.parseUnits("5000", 18),
				0,
				[sharkToken.address, babyToken.address],
				owner.address,
				"99000000000000000"
			);
			await tx.wait();
		});
	
		it("Morocco Token2 - Token1", async function () {
			tx = await exchangeRouter.swapExactTokensForTokens(
				ethers.utils.parseUnits("5000", 18),
				0,
				[babyToken.address, sharkToken.address],
				owner.address,
				"99000000000000000"
			);
			await tx.wait();
		});
	});
}
