import { lastDateRange, monthsDifference } from "@/app/data/dates";
import styles from "./styles.module.css";
import { MenuTopBar } from "@/app/components/MenuTopBar";
import { getOpenairs } from "@/app/data/getOpenairs";
import {
  dateStringFromRange,
  getSlug,
  isRecentOrUpcomingDateRange,
  withoutTrailingSlash,
} from "@/app/data/processing";
import { getOpenairInfo } from "@/app/data/scraping/database";
import { ExternalLink } from "react-feather";

const EventPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const openairs = await getOpenairs();
  const { slug } = await params;
  const openair = openairs.find((o) => getSlug(o.name) === slug);
  const recentDates = openair?.dates.filter(isRecentOrUpcomingDateRange);
  const { artists, isCampingPossible } = await getOpenairInfo(slug)
    .then((info) =>
      recentDates &&
      info?.scrapingDate &&
      monthsDifference(info.scrapingDate, lastDateRange(recentDates).end) < 11
        ? {
            artists: [...new Set(info?.artists)].filter(
              (artist) => typeof artist === "string"
            ),
            isCampingPossible: info?.isCampingPossible,
          }
        : {}
    )
    .catch(() => ({ artists: undefined, isCampingPossible: undefined }));
  return (
    <>
      <MenuTopBar homeButton="back" />
      {openair && recentDates ? (
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
            <dd>{recentDates.map(dateStringFromRange).join(", ")}</dd>
            <dt>event website</dt>
            <dd>
              <a
                className={styles.website + " tag clickable"}
                href={openair.website}
                target="_blank"
                title="event website"
              >
                <span style={{ marginInlineEnd: "0.8rem" }}>
                  {withoutTrailingSlash(
                    openair.website.replace("https://", "")
                  )}
                </span>
                <ExternalLink
                  size="1.4em"
                  style={{ verticalAlign: "text-bottom" }}
                />
              </a>
            </dd>
            <dt>main music styles</dt>
            <dd>{openair.musicTypes.join(", ")}</dd>
            <dt>
              camping{" "}
              <span className={styles.aigenerated}>
                (AI-generated, may be inaccurate)
              </span>
            </dt>
            <dd>
              {isCampingPossible ? (
                <span
                  className="tag"
                  style={{ backgroundColor: "rgba(0, 255, 0, 0.3)" }}
                >
                  possible
                </span>
              ) : (
                <span
                  className="tag"
                  style={{ backgroundColor: "rgba(255, 240, 0, 0.3)" }}
                >
                  unknown
                </span>
              )}
            </dd>
            {artists && artists.length > 0 && (
              <>
                <dt>
                  featured artists{" "}
                  <span className={styles.aigenerated}>
                    (AI-generated, may be inaccurate)
                  </span>
                </dt>
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
            {openair.since && (
              <>
                <dt>history</dt>
                <dd>
                  takes place since {openair.since.year}
                  {/* {openair.since.source && (
                    <sup
                      title={`source: ${
                        openair.since.source === "website"
                          ? "festival website"
                          : openair.since.source
                      }`}
                    >
                      <Info size={12} />
                    </sup>
                  )} */}
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
