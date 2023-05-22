import styles from "./styles.module.css";
import { ItemList } from "./components/ItemList";
import { getOpenairs } from "./data/getOpenairs";

const Home = async () => {
  const openairs = await getOpenairs();
  return (
    <>
      <header className={styles.header}>
        <h1>Openairs, festivals and everything music in Switzerland.</h1>
      </header>
      <ItemList openairs={openairs} />
    </>
  );
};

export default Home;
