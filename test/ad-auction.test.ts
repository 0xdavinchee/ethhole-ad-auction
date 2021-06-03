import { expect } from "./chai-setup";
import { AdvertisementAuction } from "../typechain";
import {
  ethers,
  deployments,
  getUnnamedAccounts,
  getNamedAccounts,
} from "hardhat";
import { setupUser, setupUsers } from "./utils";

const SQUANCH_IMAGE_URL =
  "https://static.wikia.nocookie.net/rickandmorty/images/1/16/Squanchy_.png/revision/latest?cb=20160830140218";

const setup = async () => {
  await deployments.fixture(["AdvertisementAuction"]);
  const contracts = {
    AdvertisementAuction: (await ethers.getContract(
      "AdvertisementAuction"
    )) as AdvertisementAuction,
  };

  const participants = await getUnnamedAccounts();
  const { deployer } = await getNamedAccounts();

  return {
    ...contracts,
    deployer: await setupUser(deployer, contracts),
    participants: await setupUsers(participants, contracts),
  };
};

describe("AdvertisementAuction", () => {
  describe("Create Ad Tests", () => {
    it("Should be empty on init", async () => {
      const { AdvertisementAuction } = await setup();
      expect(await AdvertisementAuction.advertText()).to.equal("");
      expect(await AdvertisementAuction.advertImageUrlText()).to.equal("");
      expect(await AdvertisementAuction.lastBid()).to.equal(0);
    });

    it("Should allow user to update text initially", async () => {
      const { AdvertisementAuction } = await setup();
      expect(
        await AdvertisementAuction.setTexts("squanch", SQUANCH_IMAGE_URL, {
          value: ethers.utils.parseEther("0.01"),
        })
      );
    });

    it("Should allow user to update text", async () => {
      const { AdvertisementAuction, deployer } = await setup();
      await expect(
        AdvertisementAuction.setTexts("squanch", SQUANCH_IMAGE_URL, {
          value: ethers.utils.parseEther("0.01"),
        })
      )
        .to.emit(AdvertisementAuction, "CreateAdvertisement")
        .withArgs(
          deployer.address,
          "squanch",
          SQUANCH_IMAGE_URL,
          ethers.utils.parseEther("0.01")
        );
    });

    it("Should allow user to outbid and update text", async () => {
      const { AdvertisementAuction, participants } = await setup();
      await AdvertisementAuction.setTexts("squanch", SQUANCH_IMAGE_URL, {
        value: ethers.utils.parseEther("0.01"),
      });
      await expect(
        participants[0].AdvertisementAuction.setTexts(
          "squinch",
          SQUANCH_IMAGE_URL,
          {
            value: ethers.utils.parseEther("0.02"),
          }
        )
      )
        .to.emit(AdvertisementAuction, "CreateAdvertisement")
        .withArgs(
          participants[0].address,
          "squinch",
          SQUANCH_IMAGE_URL,
          ethers.utils.parseEther("0.02")
        );
    });

    it("Should not allow user to update with equal or lower bid.", async () => {
      const { AdvertisementAuction, participants } = await setup();
      await AdvertisementAuction.setTexts("squanch", SQUANCH_IMAGE_URL, {
        value: ethers.utils.parseEther("0.02"),
      });
      await expect(
        participants[0].AdvertisementAuction.setTexts(
          "squinch",
          SQUANCH_IMAGE_URL,
          {
            value: ethers.utils.parseEther("0.01"),
          }
        )
      ).to.be.revertedWith("Your bid must be higher than the last bid.");
      await expect(
        participants[0].AdvertisementAuction.setTexts(
          "squinch",
          SQUANCH_IMAGE_URL,
          {
            value: ethers.utils.parseEther("0.02"),
          }
        )
      ).to.be.revertedWith("Your bid must be higher than the last bid.");
    });
  });

  describe("Withdrawal Tests", () => {
    it("Should allow owner to withdraw funds.", async () => {
      const { AdvertisementAuction, participants } = await setup();
      await participants[0].AdvertisementAuction.setTexts(
        "squanch",
        SQUANCH_IMAGE_URL,
        {
          value: ethers.utils.parseEther("0.02"),
        }
      );
      await participants[1].AdvertisementAuction.setTexts(
        "squinch",
        SQUANCH_IMAGE_URL,
        {
          value: ethers.utils.parseEther("0.021"),
        }
      );

      const withdrawTxn = AdvertisementAuction.withdrawFunds();
      // const withdrawReceipt = await withdrawTxn;
      await expect(withdrawTxn)
        .to.emit(AdvertisementAuction, "Withdrawal")
        .withArgs(ethers.utils.parseEther("0.041"));
    });

    it("Should allow owner to withdraw funds.", async () => {
      const { AdvertisementAuction, participants } = await setup();
      await participants[0].AdvertisementAuction.setTexts(
        "squanch",
        SQUANCH_IMAGE_URL,
        {
          value: ethers.utils.parseEther("0.02"),
        }
      );
      await participants[1].AdvertisementAuction.setTexts(
        "squinch",
        SQUANCH_IMAGE_URL,
        {
          value: ethers.utils.parseEther("0.021"),
        }
      );

      await expect(AdvertisementAuction.withdrawFunds())
        .to.emit(AdvertisementAuction, "Withdrawal")
        .withArgs(ethers.utils.parseEther("0.041"));
    });

    it("Should not allow non-owner to withdraw funds.", async () => {
      const { AdvertisementAuction, participants } = await setup();
      await participants[0].AdvertisementAuction.setTexts(
        "squanch",
        SQUANCH_IMAGE_URL,
        {
          value: ethers.utils.parseEther("0.02"),
        }
      );
      await participants[1].AdvertisementAuction.setTexts(
        "squinch",
        SQUANCH_IMAGE_URL,
        {
          value: ethers.utils.parseEther("0.021"),
        }
      );
      AdvertisementAuction.withdrawFunds();

      await expect(
        participants[1].AdvertisementAuction.withdrawFunds()
      ).to.be.revertedWith("You are not the owner.");
    });

    it("Should not allow withdrawal of no funds.", async () => {
      const { AdvertisementAuction } = await setup();
      await expect(AdvertisementAuction.withdrawFunds()).to.be.revertedWith(
        "There is nothing to withdraw."
      );
    });
  });
});
