/** Seeded demonstration accounts. These exist only in the demo dataset. */
export const DEMO_PASSWORD = "Demo1234!";

export const DEMO_ACCOUNTS = [
  { email: "admin@angkorev.kh", role: "Super admin", name: "Sophea Admin", detail: "Platform oversight, tenants, moderation" },
  { email: "dealer@angkorev.kh", role: "Dealer owner", name: "Dara Motors", detail: "Tenant owner — Angkor Auto Group" },
  { email: "sales@angkorev.kh", role: "Sales agent", name: "Chanthy Sales", detail: "Tenant staff — limited permissions" },
  { email: "seller@angkorev.kh", role: "Private seller", name: "Vibol Sok", detail: "Individual listing owner" },
  { email: "buyer@angkorev.kh", role: "Customer", name: "Mealea Buyer", detail: "Favourites, reports, appointments" },
] as const;
