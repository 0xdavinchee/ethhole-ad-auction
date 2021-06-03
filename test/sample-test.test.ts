import { expect } from "./chai-setup";
import { AdvertisementAuction } from "../typechain";
import { ethers, deployments } from "hardhat";

const setup = async () => {
  await deployments.fixture(["AdvertisementAuction"]);
  const contracts = {
    AdvertisementAuction: (await ethers.getContract(
      "AdvertisementAuction"
    )) as AdvertisementAuction,
  };

  return { ...contracts };
};

describe("AdvertisementAuction", function () {
  it("Should be empty on init", async function () {
    const { AdvertisementAuction } = await setup();
    expect(await AdvertisementAuction.advertText()).to.equal("");
    expect(await AdvertisementAuction.advertImageUrlText()).to.equal("");
    expect(await AdvertisementAuction.currentBid()).to.equal(0);
  });
});
