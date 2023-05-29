import { MainView } from "./components/MainView";
import { getOpenairs } from "./data/getOpenairs";
import type { Openair } from "./data/types";
import { MenuTopBar } from "./components/MenuTopBar";
import { isRecentOrUpcomingDateRange } from "./data/processing";

const Home = async () => {
  const openairs = await getOpenairs();
  return (
    <>
      <MenuTopBar />
      <MainView openairs={openairs.filter(isRecentOrUpcomingOpenair)} />
    </>
  );
};

const isRecentOrUpcomingOpenair = (openair: Openair): boolean =>
  openair.dates.some(isRecentOrUpcomingDateRange);

export default Home;
