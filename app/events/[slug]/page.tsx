import styles from "./styles.module.css";
import { MenuTopBar } from "@/app/components/MenuTopBar";
import { getOpenairs } from "@/app/data/getOpenairs";
import { dateStringFromRange, getSlug } from "@/app/data/processing";
import { getOpenairInfo } from "@/app/data/scraping/database";

const EventPage = async ({ params }: { params: { slug: string } }) => {
  const openairs = await getOpenairs();
  const { slug } = params;
  const openair = openairs.find((o) => getSlug(o.name) === slug);
  const artists = await getOpenairInfo(slug)
    .then((info) => [...new Set(info?.lineup)])
    .catch(() => undefined);
  return (
    <>
      <MenuTopBar />
      {openair ? (
        <main className={styles.main}>
          <header className={styles.header}>
            <h1>{openair.name}</h1>
          </header>
          <dl className={styles.info}>
            <dt>where</dt>
            <dd>
              {openair.place}, {openair.canton}
            </dd>
            <dt>when</dt>
            <dd>{openair.dates.map(dateStringFromRange).join(", ")}</dd>
            <dt>main music styles</dt>
            <dd>{openair.musicTypes}</dd>
            {artists && (
              <>
                <dt>featured artists (AI-generated, may be inaccurate)</dt>
                <dd>
                  {artists.map((artist, i) => (
                    <span
                      key={artist}
                      style={{
                        opacity: i % 2 ? 1 : 0.66,
                        marginRight: "0.5rem",
                      }}
                    >
                      {artist}
                    </span>
                  ))}
                </dd>
              </>
            )}
          </dl>
        </main>
      ) : (
        <main className={styles.main}>
          <header className={styles.header}>
            <h1>Openair not found</h1>
          </header>
          Please check the URL for typos.
        </main>
      )}
    </>
  );
};

export default EventPage;

export const generateStaticParams = () =>
  getOpenairs().then((openairs) =>
    openairs.map((openair) => ({
      slug: getSlug(openair.name),
    }))
  );
