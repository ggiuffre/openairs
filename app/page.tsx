import styles from "./styles.module.css";
import { Filter } from "./components/Filter";
import { getOpenairs } from "./data/getOpenairs";
import type { Openair } from "./data/types";

const Home = async () => {
  const openairs = await getOpenairs();
  return (
    <>
      <header className={styles.header}>
        <h1>Openairs, festivals and everything music in Switzerland.</h1>
      </header>
      <Filter openairs={openairs.filter(isNotFinished)} />
    </>
  );
};

const isNotFinished = (openair: Openair): boolean =>
  openair.dates.some((dateRange) => dateRange.end >= new Date());

export default Home;
