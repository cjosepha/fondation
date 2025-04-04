// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IUniswapV2Router02} from '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import {MockERC20} from "./MockERC20.sol";
import {MockAaveOracle} from "./MockAaveOracle.sol";

contract MockUniSwapRouter is IUniswapV2Router02 {

    using Strings for uint256;

    MockERC20 private wBTC;
    MockERC20 private USDC;
    MockAaveOracle private aaveOracle;

    uint public swapAmountIn;
    uint public swapAmountOutMin;
    address public swapTo;

    constructor(MockERC20 _USDC, MockERC20 _wBTC, MockAaveOracle _aaveOracle) {
        USDC = _USDC;
        wBTC = _wBTC;
        aaveOracle = _aaveOracle;
    }

    function WETH() external pure override returns (address) {
        return address(0);
    }

    function factory() external pure override returns (address) {
        return address(0);
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external override returns (uint[] memory amounts) {
        require(path[0] == address(USDC), "MockUniSwapRouter: First token should be USDC");
        require(path[1] == address(wBTC), "MockUniSwapRouter: Second token should be wBTC");
        require(deadline >= block.timestamp, "MockUniSwapRouter: Invalid deadline");
        swapAmountIn = amountIn;
        swapAmountOutMin = amountOutMin;
        swapTo = to;
        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = (amountIn * 1e10) / aaveOracle.getAssetPrice(address(wBTC));
        require(
            amounts[1] >= amountOutMin,
            string(
                abi.encodePacked(
                    "MockUniSwapRouter: output amount (",
                    amounts[1].toString(),
                    ") is lower than minimum amount (",
                    amountOutMin.toString(),
                    ")"
                )
            )
        );
        USDC.transferFrom(to, address(this), amounts[0]);
        wBTC.transfer(to, amounts[1]);
        return amounts;
    }

    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external override returns (uint[] memory amounts) {}

    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external override payable returns (uint[] memory amounts) {}

    function swapTokensForExactETH(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external override returns (uint[] memory amounts) {}

    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external override returns (uint[] memory amounts) {}

    function swapETHForExactTokens(
        uint amountOut,
        address[] calldata path,
        address to,
        uint deadline
    ) external override payable returns (uint[] memory amounts) {}

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external override returns (uint amountA, uint amountB, uint liquidity) {}

    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external override payable returns (uint amountToken, uint amountETH, uint liquidity) {}

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external override returns (uint amountA, uint amountB) {}

    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external override returns (uint amountToken, uint amountETH) {}

    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external override returns (uint amountA, uint amountB) {}

    function removeLiquidityETHWithPermit(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external override returns (uint amountToken, uint amountETH) {}

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external override {}

    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external override payable {}

    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external override {}

    function quote(
        uint amountA,
        uint reserveA,
        uint reserveB
    ) external pure override returns (uint amountB) {}

    function getAmountOut(
        uint amountIn,
        uint reserveIn,
        uint reserveOut
    ) external pure override returns (uint amountOut) {}

    function getAmountIn(
        uint amountOut,
        uint reserveIn,
        uint reserveOut
    ) external pure override returns (uint amountIn) {}

    function getAmountsOut(
        uint amountIn,
        address[] calldata path
    ) external view override returns (uint[] memory amounts) {}

    function getAmountsIn(
        uint amountOut,
        address[] calldata path
    ) external view override returns (uint[] memory amounts) {}

    function removeLiquidityETHSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external override returns (uint amountETH) {}

    function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external override returns (uint amountETH) {}
}