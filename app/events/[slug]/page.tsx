import { ItemCard } from "@/app/components/ItemCard";
import { MenuTopBar } from "@/app/components/MenuTopBar";
import { getOpenairs } from "@/app/data/getOpenairs";
import { getSlug } from "@/app/data/processing";

const EventPage = async ({ params }: { params: { slug: string } }) => {
  const openairs = await getOpenairs();
  const { slug } = params;
  const openair = openairs.find((o) => getSlug(o.name) === slug);
  return (
    <>
      <MenuTopBar />
      <div style={{ padding: "6rem 5rem" }}>
        {openair ? <ItemCard openair={openair} /> : <p>Openair not found</p>}
      </div>
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
