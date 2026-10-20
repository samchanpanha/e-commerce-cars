import { desc, eq } from "drizzle-orm";
import { Heart } from "lucide-react";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { getAuthContext } from "@/lib/auth";
import { getComparableListings } from "@/lib/listings";
import { getT } from "@/i18n";
import { CarCard } from "@/components/listing/car-card";
import { EmptyState } from "@/components/ui/empty";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const [{ lang, t }, ctx] = await Promise.all([getT(), getAuthContext()]);
  if (!ctx.user) return null;

  const rows = await db
    .select({ listingId: favorites.listingId })
    .from(favorites)
    .where(eq(favorites.userId, ctx.user.id))
    .orderBy(desc(favorites.createdAt));
  const cars = await getComparableListings(rows.map((r) => r.listingId));

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{t("customer.favorites")}</h1>
      {cars.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title={t("customer.empty.favorites")}
            body={t("customer.empty.favoritesBody")}
            icon={<Heart className="h-8 w-8" />}
            action={<ButtonLink href="/cars">{t("nav.browse")}</ButtonLink>}
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cars.map((car) => <CarCard key={car.id} car={car} lang={lang} />)}
        </div>
      )}
    </div>
  );
}
