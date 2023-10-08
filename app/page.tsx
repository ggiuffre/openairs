import { MainView } from "./components/MainView";
import { getOpenairs } from "./data/getOpenairs";
import { MenuTopBar } from "./components/MenuTopBar";

const Home = async () => {
  const openairs = await getOpenairs();

  return (
    <>
      <MenuTopBar />
      <MainView openairs={openairs} />
    </>
  );
};

export default Home;
