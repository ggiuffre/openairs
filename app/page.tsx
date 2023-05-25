import styles from "./styles.module.css";
import { MainView } from "./components/MainView";
import { getOpenairs } from "./data/getOpenairs";
import type { Openair } from "./data/types";

const Home = async () => {
  const openairs = await getOpenairs();
  return (
    <>
      <header className={styles.header}>
        <h1>Openairs, festivals and everything music in Switzerland.</h1>
      </header>
      <MainView openairs={openairs.filter(isRecentOrUpcoming)} />
    </>
  );
};

const isRecentOrUpcoming = (openair: Openair): boolean => {
  const includePastDays = 7; // n
  const reference = new Date(); // today
  reference.setDate(reference.getDate() - includePastDays); // n days ago
  return openair.dates.some((dateRange) => dateRange.end >= reference);
};

export default Home;
