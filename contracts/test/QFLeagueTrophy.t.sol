// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/QFLeagueTrophy.sol";

contract QFLeagueTrophyTest is Test {
    QFLeagueTrophy trophy;
    address owner = address(this);
    address minter = address(0xBEEF);
    address winner1 = address(0x1111);
    address winner2 = address(0x2222);
    address nobody = address(0x9999);

    string silverURI = "ipfs://QmFakeHash123/silver-sudoku-duel.json";
    string bronzeURI = "ipfs://QmFakeHash456/bronze-sudoku-duel.json";

    function setUp() public {
        trophy = new QFLeagueTrophy(minter);
    }

    // ── Deployment ─────────────────────────────────────────────────

    function test_DeploymentSetsNameAndSymbol() public view {
        assertEq(trophy.name(), "QF League Trophy");
        assertEq(trophy.symbol(), "QFTROPHY");
    }

    function test_DeploymentSetsMinter() public view {
        assertEq(trophy.minter(), minter);
    }

    function test_DeploymentSetsOwner() public view {
        assertEq(trophy.owner(), owner);
    }

    function test_DeploymentStartsAtZeroSupply() public view {
        assertEq(trophy.totalSupply(), 0);
    }

    function test_RevertIfZeroMinterOnDeploy() public {
        vm.expectRevert(QFLeagueTrophy.ZeroAddress.selector);
        new QFLeagueTrophy(address(0));
    }

    // ── Minting ────────────────────────────────────────────────────

    function test_MinterCanMint() public {
        vm.prank(minter);
        uint256 tokenId = trophy.mint(winner1, silverURI);
        assertEq(tokenId, 1);
        assertEq(trophy.ownerOf(1), winner1);
        assertEq(trophy.tokenURI(1), silverURI);
        assertEq(trophy.totalSupply(), 1);
    }

    function test_MintMultipleTrophies() public {
        vm.startPrank(minter);
        uint256 id1 = trophy.mint(winner1, silverURI);
        uint256 id2 = trophy.mint(winner2, bronzeURI);
        vm.stopPrank();

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(trophy.ownerOf(1), winner1);
        assertEq(trophy.ownerOf(2), winner2);
        assertEq(trophy.tokenURI(1), silverURI);
        assertEq(trophy.tokenURI(2), bronzeURI);
        assertEq(trophy.totalSupply(), 2);
        assertEq(trophy.balanceOf(winner1), 1);
        assertEq(trophy.balanceOf(winner2), 1);
    }

    function test_SamePlayerCanHaveMultipleTrophies() public {
        vm.startPrank(minter);
        trophy.mint(winner1, silverURI);
        trophy.mint(winner1, bronzeURI);
        vm.stopPrank();

        assertEq(trophy.balanceOf(winner1), 2);
    }

    function test_MintEmitsTrophyMintedEvent() public {
        vm.prank(minter);
        vm.expectEmit(true, true, false, true);
        emit QFLeagueTrophy.TrophyMinted(winner1, 1, silverURI);
        trophy.mint(winner1, silverURI);
    }

    function test_RevertIfNonMinterMints() public {
        vm.prank(nobody);
        vm.expectRevert(QFLeagueTrophy.NotMinter.selector);
        trophy.mint(winner1, silverURI);
    }

    function test_RevertIfOwnerMints() public {
        vm.expectRevert(QFLeagueTrophy.NotMinter.selector);
        trophy.mint(winner1, silverURI);
    }

    function test_RevertIfMintToZeroAddress() public {
        vm.prank(minter);
        vm.expectRevert(QFLeagueTrophy.ZeroAddress.selector);
        trophy.mint(address(0), silverURI);
    }

    // ── Soulbound ──────────────────────────────────────────────────

    function test_RevertOnTransfer() public {
        vm.prank(minter);
        trophy.mint(winner1, silverURI);

        vm.prank(winner1);
        vm.expectRevert(QFLeagueTrophy.SoulboundTransfer.selector);
        trophy.transferFrom(winner1, winner2, 1);
    }

    function test_RevertOnSafeTransfer() public {
        vm.prank(minter);
        trophy.mint(winner1, silverURI);

        vm.prank(winner1);
        vm.expectRevert(QFLeagueTrophy.SoulboundTransfer.selector);
        trophy.safeTransferFrom(winner1, winner2, 1);
    }

    function test_RevertOnApprovedTransfer() public {
        vm.prank(minter);
        trophy.mint(winner1, silverURI);

        vm.prank(winner1);
        trophy.approve(nobody, 1);

        vm.prank(nobody);
        vm.expectRevert(QFLeagueTrophy.SoulboundTransfer.selector);
        trophy.transferFrom(winner1, winner2, 1);
    }

    // ── Access control ─────────────────────────────────────────────

    function test_OwnerCanSetMinter() public {
        trophy.setMinter(nobody);
        assertEq(trophy.minter(), nobody);
    }

    function test_SetMinterEmitsEvent() public {
        vm.expectEmit(true, true, false, false);
        emit QFLeagueTrophy.MinterUpdated(minter, nobody);
        trophy.setMinter(nobody);
    }

    function test_RevertIfNonOwnerSetsMinter() public {
        vm.prank(nobody);
        vm.expectRevert();
        trophy.setMinter(nobody);
    }

    function test_RevertIfSetMinterToZero() public {
        vm.expectRevert(QFLeagueTrophy.ZeroAddress.selector);
        trophy.setMinter(address(0));
    }

    function test_NewMinterCanMint() public {
        trophy.setMinter(nobody);
        vm.prank(nobody);
        uint256 tokenId = trophy.mint(winner1, silverURI);
        assertEq(tokenId, 1);
    }

    function test_OldMinterCannotMintAfterChange() public {
        trophy.setMinter(nobody);
        vm.prank(minter);
        vm.expectRevert(QFLeagueTrophy.NotMinter.selector);
        trophy.mint(winner1, silverURI);
    }

    // ── Token URI ──────────────────────────────────────────────────

    function test_RevertTokenURIForNonexistentToken() public {
        vm.expectRevert();
        trophy.tokenURI(999);
    }
}
