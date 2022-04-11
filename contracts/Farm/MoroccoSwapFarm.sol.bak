// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "./IERC20MetaData.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MoroccoSwapFarm is Ownable {
    using SafeMath for uint256;
    // Info of each user.
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt0;
        uint256 rewardDebt1;
        uint256 rewardFarmDebt;
        uint256 rewardAntiDebt;
    }
    // Info of each pool.
    struct PoolInfo {
        IERC20MetaData lpToken; // Address of LP token contract.
        uint256 lastRewardBlock;
        uint256 accPerShare0;
        uint256 accPerShare1;
        IERC20MetaData rewardToken0;
        IERC20MetaData rewardToken1;
        uint256 accFarmPerShare;
    }

    bool public paused;
    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Info of each user that stakes LP tokens.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    // Lp address with id
    mapping(address => uint256) public lpIndex;
    mapping(address => bool) public lpStatus;
    // operator record
    mapping(address => bool) public operator;


    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(
        address indexed user,
        uint256 indexed pid,
        uint256 amount
    );
    event AddReward(
        address lp,
        address rewardToken0,
        address rewardToken1,
        uint256 reward0,
        uint256 reward1
    );
    event Claim(
        address indexed user,
        uint256 indexed pid,
        uint256 reward0,
        uint256 reward1
    );
    event Paused();
    event UnPaused();
    event AddOperator(address _operator);
    event RemoveOperator(address _operator);
    event AddLpInfo(
        IERC20MetaData _lpToken,
        IERC20MetaData _rewardToken0,
        IERC20MetaData _rewardToken1
    );
    event AddLpInfo(IERC20MetaData _lpToken);
   
   
    modifier isPaused() {
        require(!paused, "contract Locked");
        _;
    }

    modifier isPoolExist(uint256 poolId) {
        require(poolId < poolLength(), "pool not exist");
        _;
    }

    modifier isOperator() {
        require(operator[msg.sender], "only operator");
        _;
    }

    constructor(
        address _factory,
        address _owner
        ) public {
        require(_factory != address(0x000), "zero address");
        require(address(_owner) != address(0x000), "zero address");

        operator[_factory] = true;
        operator[_owner] = true;
        transferOwnership(_owner);
        emit AddOperator(_factory);
    }

    function addLPInfo(
        IERC20MetaData _lpToken,
        IERC20MetaData _rewardToken0,
        IERC20MetaData _rewardToken1
    ) public isOperator {
        if (!lpStatus[address(_lpToken)]) {
            uint256 currentIndex = poolLength();
            poolInfo.push(
                PoolInfo({
                    lpToken: _lpToken,
                    lastRewardBlock: block.number,
                    accPerShare0: 0,
                    accPerShare1: 0,
                    rewardToken0: _rewardToken0,
                    rewardToken1: _rewardToken1,
                    accFarmPerShare: 0
                })
            );
            lpIndex[address(_lpToken)] = currentIndex;
            lpStatus[address(_lpToken)] = true;
            emit AddLpInfo(_lpToken, _rewardToken0, _rewardToken1);
        }
    }

    function addrewardtoken(
        address _lp,
        address token,
        uint256 amount
    ) public {
        uint256 _pid = lpIndex[_lp];
        PoolInfo storage pool = poolInfo[_pid];

        uint256 lpSupply = pool.lpToken.balanceOf(address(this));

        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            IERC20MetaData(token).transferFrom(msg.sender, owner(), amount);
            return;
        }

        if (amount > 0) {
            if (token == address(pool.rewardToken0)) {
                pool.rewardToken0.transferFrom(
                    msg.sender,
                    address(this),
                    amount
                );
                pool.accPerShare0 = pool.accPerShare0.add(
                    amount.mul(1e12).div(lpSupply)
                );
            } else if (token == address(pool.rewardToken1)) {
                pool.rewardToken1.transferFrom(
                    msg.sender,
                    address(this),
                    amount
                );
                pool.accPerShare1 = pool.accPerShare1.add(
                    amount.mul(1e12).div(lpSupply)
                );
            }
        }

        pool.lastRewardBlock = block.number;
        emit AddReward(address(pool.lpToken), token, address(0x000), amount, 0);
    }

    // Update reward variables of the given pool to be up-to-date.
    function addReward(
        address _lp,
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1
    ) public {
        uint256 _pid = lpIndex[_lp];
        PoolInfo storage pool = poolInfo[_pid];

        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        uint256 reward0;
        uint256 reward1;
        if (address(pool.rewardToken0) == token0) {
            reward0 = amount0;
            reward1 = amount1;
        } else {
            reward0 = amount1;
            reward1 = amount0;
        }

        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            pool.rewardToken0.transferFrom(msg.sender, owner(), reward0);
            pool.rewardToken1.transferFrom(msg.sender, owner(), reward1);
            return;
        }

        if (reward0 > 0) {
            pool.rewardToken0.transferFrom(msg.sender, address(this), reward0);
            pool.accPerShare0 = pool.accPerShare0.add(
                reward0.mul(1e12).div(lpSupply)
            );
        }
        if (reward1 > 0) {
            pool.rewardToken1.transferFrom(msg.sender, address(this), reward1);
            pool.accPerShare1 = pool.accPerShare1.add(
                reward1.mul(1e12).div(lpSupply)
            );
        }
        pool.lastRewardBlock = block.number;
        emit AddReward(
            address(pool.lpToken),
            address(pool.rewardToken0),
            address(pool.rewardToken1),
            reward0,
            reward1
        );
    }

    function deposit(uint256 _pid, uint256 _amount)
        public
        isPaused
        isPoolExist(_pid)
    {
        require(_amount > 0, "zero amount");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        if (user.amount > 0) {
            claimReward(_pid);
        }
        pool.lpToken.transferFrom(
            address(msg.sender),
            address(this),
            _amount
        );
        user.amount = user.amount.add(_amount);
        user.rewardDebt0 = user.amount.mul(pool.accPerShare0).div(1e12);
        user.rewardDebt1 = user.amount.mul(pool.accPerShare1).div(1e12);
        emit Deposit(msg.sender, _pid, _amount);
    }

    function claimReward(uint256 _pid) public isPaused isPoolExist(_pid) {
        address _userAddr = msg.sender;
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_userAddr];
        uint256 pendingReward0;
        uint256 pendingReward1;

        if (user.amount > 0) {
            pendingReward0 = user.amount.mul(pool.accPerShare0).div(1e12).sub(
                user.rewardDebt0
            );
            safeRewardTransfer(pool.rewardToken0, _userAddr, pendingReward0);
            pendingReward1 = user.amount.mul(pool.accPerShare1).div(1e12).sub(
                user.rewardDebt1
            );
            safeRewardTransfer(pool.rewardToken1, _userAddr, pendingReward1);
                }
        user.rewardDebt0 = user.amount.mul(pool.accPerShare0).div(1e12);
        user.rewardDebt1 = user.amount.mul(pool.accPerShare1).div(1e12);
        emit Claim(_userAddr, _pid, pendingReward0, pendingReward1);
    }

    function withdraw(uint256 _pid, uint256 _amount)
        public
        isPaused
        isPoolExist(_pid)
    {
        require(_amount > 0, "zero amount");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");

        if (user.amount > 0) {
            claimReward(_pid);
          
        }

        user.amount = user.amount.sub(_amount);
        user.rewardDebt0 = user.amount.mul(pool.accPerShare0).div(1e12);
        pool.lpToken.transfer(address(msg.sender), _amount);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) public isPoolExist(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        pool.lpToken.transfer(address(msg.sender), user.amount);
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        user.amount = 0;
        user.rewardDebt0 = 0;
        user.rewardDebt1 = 0;
    }

    // Safe transfer function
    function safeRewardTransfer(
        IERC20MetaData _reward,
        address _to,
        uint256 _amount
    ) internal {
        uint256 _rewardBal = _reward.balanceOf(address(this));
        if (_amount > _rewardBal) {
            _reward.transfer(_to, _rewardBal);
        } else {
            _reward.transfer(_to, _amount);
        }
    }

    function poolLength() public view returns (uint256) {
        return poolInfo.length;
    }

    function pause() external isOperator {
        require(!paused, "already paused");
        paused = true;
        emit Paused();
    }

    function unPause() external isOperator {
        require(!paused, "already unPaused");
        paused = false;
        emit UnPaused();
    }

    function addOperator(address _addr) external onlyOwner {
        operator[_addr] = true;
        emit AddOperator(_addr);
    }

    function removeOperator(address _addr) external onlyOwner {
        operator[_addr] = false;
        emit RemoveOperator(_addr);
    }


}
