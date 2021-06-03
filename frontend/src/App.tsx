import { useEffect, useMemo, useState } from "react";
import { BigNumber, ethers } from "ethers";
import AdvertisementAuction from "./artifacts/contracts/AdvertisementAuction.sol/AdvertisementAuction.json";
import { AdvertisementAuction as AdAuctionContract } from "../../typechain";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  createMuiTheme,
  CssBaseline,
  Paper,
  TextField,
  ThemeProvider,
  Typography,
  useMediaQuery,
} from "@material-ui/core";
import Empty from "./empty.jpeg";

interface ICreateAdvertisement {
  id: number;
  creator: string;
  text: string;
  urlText: string;
  bidAmount: string;
  lastBidAt: string;
}

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "";

function App() {
  const [loading, setLoading] = useState(true);
  const [adId, setAdId] = useState(0);
  const [adCreator, setAdCreator] = useState(ethers.constants.AddressZero);
  const [imageTextUrl, setImageTextUrl] = useState("");
  const [text, setText] = useState("");
  const [mostRecentBid, setMostRecentBid] = useState(0);
  const [lastBidAt, setLastBidAt] = useState(0);
  const [newImageTextUrl, setNewImageTextUrl] = useState("");
  const [newText, setNewText] = useState("");
  const [newBid, setNewBid] = useState("");
  const [pastAds, setPastAds] = useState<ICreateAdvertisement[]>([]);

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: prefersDarkMode ? "dark" : "light",
        },
      }),
    [prefersDarkMode]
  );
  const lastBidAtMs = lastBidAt * 1000;
  const lastBidAtDateTimeString =
    new Date(lastBidAtMs).toDateString() +
    " " +
    new Date(lastBidAtMs).toLocaleTimeString();

  const isGlobalEthObjEmpty = typeof (window as any).ethereum == null;

  const requestAccount = async () => {
    if (isGlobalEthObjEmpty) return;
    await (window as any).ethereum.request({ method: "eth_requestAccounts" });
  };

  const initializeContract = (requiresSigner: boolean) => {
    const ethereum = (window as any).ethereum;
    if (isGlobalEthObjEmpty) return null;
    const provider = new ethers.providers.Web3Provider(ethereum);
    if (requiresSigner) {
      const signer = provider.getSigner();
      return new ethers.Contract(
        CONTRACT_ADDRESS,
        AdvertisementAuction.abi,
        signer
      ) as AdAuctionContract;
    } else {
      return new ethers.Contract(
        CONTRACT_ADDRESS,
        AdvertisementAuction.abi,
        provider
      ) as AdAuctionContract;
    }
    return null;
  };

  const getCurrentAdData = async () => {
    const contract = initializeContract(false);
    if (!contract) return null;

    const idPromise = contract.id();
    const textPromise = contract.advertText();
    const adCreatorPromise = contract.lastBidder();
    const advertImageUrlTextPromise = contract.advertImageUrlText();
    const lastBidPromise = contract.lastBid();
    const lastBidAtPromise = contract.lastBidAt();
    const [
      idResult,
      textResult,
      adCreatorResult,
      adImageURLResult,
      lastBidResult,
      lastBidAtResult,
    ] = await Promise.all([
      idPromise,
      textPromise,
      adCreatorPromise,
      advertImageUrlTextPromise,
      lastBidPromise,
      lastBidAtPromise,
    ]);
    return {
      id: idResult,
      text: textResult,
      adCreator: adCreatorResult,
      adImageURL: adImageURLResult,
      lastBid: lastBidResult,
      lastBidAt: lastBidAtResult,
    };
  };

  const createNewAd = async () => {
    await requestAccount();

    const contract = initializeContract(true);
    if (!contract) return;
    const createAdTxn = await contract.setTexts(newText, newImageTextUrl, {
      value: ethers.utils.parseEther(newBid),
    });
    await createAdTxn.wait();
  };

  useEffect(() => {
    (async () => {
      const data = await getCurrentAdData();
      if (!data) return;

      setAdId(data.id.toNumber());
      setAdCreator(data.adCreator);
      setText(data.text);
      setImageTextUrl(data.adImageURL);
      setMostRecentBid(data.lastBid.toNumber());
      setLastBidAt(data.lastBidAt.toNumber());
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const contract = initializeContract(true);
    if (!contract) return;
    contract.on(
      "CreateAdvertisement",
      (
        id: BigNumber,
        creator: string,
        text: string,
        urlText: string,
        bid: BigNumber,
        lastBidAt: BigNumber,
        ev: ethers.Event
      ) => {
        const numberId = id.toNumber();
        setAdId(numberId);
        setAdCreator(creator);
        setText(text);
        setImageTextUrl(urlText);
        setMostRecentBid(bid.toNumber());
        setLastBidAt(lastBidAt.toNumber());
        setNewBid("");
        setNewImageTextUrl("");
        setNewText("");
      }
    );

    return () => {
      contract.removeListener("CreateAdvertisement", () => {});
    };
  }, []);

  useEffect(() => {
    (async () => {
      const contract = initializeContract(true);
      if (!contract) return;
      const adEventFilter = contract.filters.CreateAdvertisement(
        null,
        null,
        null,
        null,
        null,
        null
      );
      const adEvents = await contract.queryFilter(adEventFilter);
      const pastAds = adEvents
        .map((x) => x.args)
        .map((y) =>
          y == null
            ? null
            : ({
                id: y[0].toNumber(),
                creator: y[1],
                text: y[2],
                urlText: y[3],
                bidAmount: y[4].toString(),
                lastBidAt: y[5].toString(),
              } as ICreateAdvertisement)
        )
        .filter((x) => x != null)
        .filter((x) => x!.id !== adId) as ICreateAdvertisement[];
      setPastAds(pastAds);
    })();
  }, [adId]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {loading && <CircularProgress className="loader" />}
      {!loading && (
        <Container maxWidth="sm" className="le-container">
          <div className="ad-container">
            <img className="ad-image" src={imageTextUrl.trim() || Empty} />
            <Typography variant="h6">
              <p>{text || "Your Ad Text Goes Here"}</p>
            </Typography>
          </div>
          <Paper elevation={3}>
            <CardContent>
              <p>Last Bid At: {lastBidAtDateTimeString}</p>
              <span>
                Most Recent Bid: {ethers.utils.formatEther(mostRecentBid)} ETH
              </span>
              {adCreator !== ethers.constants.AddressZero && (
                <p>Ad Owner: {adCreator}</p>
              )}
            </CardContent>
          </Paper>
          <Card className="create-ad">
            <CardContent>
              <h2>Create your ad</h2>
              <p>
                Pay more ETH than the last person to change the text and image
                on the website.
              </p>
              <div className="inputs-container">
                <TextField
                  className="input"
                  value={newImageTextUrl}
                  onChange={(e) => setNewImageTextUrl(e.target.value)}
                  placeholder="Image URL"
                />
                <TextField
                  className="input"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Ad Text"
                />
                <TextField
                  className="input"
                  value={newBid}
                  onChange={(e) => setNewBid(e.target.value)}
                  placeholder="Bid Amount"
                  error={isNaN(Number(newBid))}
                />
                <Button
                  color="primary"
                  variant="contained"
                  onClick={createNewAd}
                  disabled={
                    Number(newBid) <=
                    Number(ethers.utils.formatEther(mostRecentBid))
                  }
                >
                  Create Ad
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="past-ads">
            <Typography variant="h6">Past Ads</Typography>
            {pastAds.map((x) => (
              <Accordion key={x.id}>
                <AccordionSummary>
                  Ad {x.id} | Creator: {x.creator}
                </AccordionSummary>
                <AccordionDetails>
                  Bid Amount: {ethers.utils.formatEther(x.bidAmount)} ETH | Bid
                  Date: {new Date(Number(x.lastBidAt) * 1000).toDateString()}
                </AccordionDetails>
              </Accordion>
            ))}
          </div>
        </Container>
      )}
    </ThemeProvider>
  );
}

export default App;
