import { ItemCard } from "./components/ItemCard";
import { getOpenairs } from "./data/getOpenairs";
import styles from "./styles.module.css";

const Home = async () => {
  const openairs = await getOpenairs();
  return (
    <>
      <header className={styles.header}>
        <h1>Openairs, festivals and everything music in Switzerland.</h1>
      </header>
      <main className={styles.main}>
        {openairs.map((openair) => (
          <ItemCard key={openair.website} openair={openair} />
        ))}
      </main>
    </>
  );
};

export default Home;
