import { MenuTopBar } from "../components/MenuTopBar";
import { getOpenairs } from "../data/getOpenairs";
import {
  getLineupFromScrapedText,
  getOpenairWebsiteText,
} from "../data/scraping";

const Home = async () => {
  const openairs = await getOpenairs();
  const openair = openairs.find((o) => o.name === "Greenfield");
  let program;
  if (openair && openair.artists) {
    const minimumText = await getOpenairWebsiteText({ openair });
    program = minimumText
      ? await getLineupFromScrapedText({
          text: minimumText,
          references: [
            openair.artists[0],
            openair.artists[1],
            openair.artists[10],
          ],
        })
      : undefined;
  }

  return (
    <>
      <MenuTopBar />
      <p>{program ? program : "Work in progress..."}</p>
    </>
  );
};

export default Home;
