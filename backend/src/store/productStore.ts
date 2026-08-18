/**
 * In-memory product catalog store.
 * Aligns with the core `products` domain model (price in integer cents).
 * Image URLs are included for storefront rendering until media service lands.
 */

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  category: string | null;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  q?: string;
}

export interface ProductListResult {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const now = new Date().toISOString();

/** Demo catalog seeded from the core schema demo data (+ storefront images). */
const PRODUCTS: Product[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    sku: "WDG-001",
    name: "Classic Widget",
    description: "Everyday widget for home and office.",
    priceCents: 1999,
    currency: "USD",
    category: "widgets",
    imageUrl: "/images/products/classic-widget.svg",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    sku: "WDG-002",
    name: "Pro Widget",
    description: "Heavy-duty widget with extended warranty.",
    priceCents: 4999,
    currency: "USD",
    category: "widgets",
    imageUrl: "/images/products/pro-widget.svg",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
    sku: "GAD-100",
    name: "Smart Gadget Mini",
    description: "Compact connected gadget with USB-C.",
    priceCents: 7999,
    currency: "USD",
    category: "gadgets",
    imageUrl: "/images/products/gadget-mini.svg",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
    sku: "GAD-200",
    name: "Smart Gadget Plus",
    description: "Full-size gadget with wireless charging.",
    priceCents: 12999,
    currency: "USD",
    category: "gadgets",
    imageUrl: "/images/products/gadget-plus.svg",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
    sku: "ACC-010",
    name: "USB-C Cable 2m",
    description: "Braided USB-C cable, 2 meter length.",
    priceCents: 1299,
    currency: "USD",
    category: "accessories",
    imageUrl: "/images/products/usb-c-cable.svg",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6",
    sku: "ACC-020",
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse with silent clicks.",
    priceCents: 3499,
    currency: "USD",
    category: "accessories",
    imageUrl: "/images/products/wireless-mouse.svg",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7",
    sku: "ACC-030",
    name: "Laptop Stand",
    description: "Aluminum laptop stand, adjustable height.",
    priceCents: 5999,
    currency: "USD",
    category: "accessories",
    imageUrl: "/images/products/laptop-stand.svg",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8",
    sku: "HME-050",
    name: "Desk Lamp LED",
    description: "Dimmable LED desk lamp with USB port.",
    priceCents: 4499,
    currency: "USD",
    category: "home",
    imageUrl: "/images/products/desk-lamp.svg",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9",
    sku: "HME-060",
    name: "Ceramic Mug Set",
    description: "Set of 4 stoneware mugs, 12 oz.",
    priceCents: 2999,
    currency: "USD",
    category: "home",
    imageUrl: "/images/products/mug-set.svg",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10",
    sku: "OUT-070",
    name: "Trail Water Bottle",
    description: "Insulated 32 oz stainless bottle.",
    priceCents: 3499,
    currency: "USD",
    category: "outdoors",
    imageUrl: "/images/products/water-bottle.svg",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11",
    sku: "OUT-080",
    name: "Daypack 20L",
    description: "Lightweight daypack with laptop sleeve.",
    priceCents: 6999,
    currency: "USD",
    category: "outdoors",
    imageUrl: "/images/products/daypack.svg",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12",
    sku: "OFF-090",
    name: "Notebook A5 Dot Grid",
    description: "Hardcover notebook, 192 pages.",
    priceCents: 1499,
    currency: "USD",
    category: "office",
    imageUrl: "/images/products/notebook.svg",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
];

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export const productStore = {
  async list(params: ProductListParams = {}): Promise<ProductListResult> {
    const page = clampInt(params.page ?? 1, 1, 1, 10_000);
    const pageSize = clampInt(
      params.pageSize ?? DEFAULT_PAGE_SIZE,
      DEFAULT_PAGE_SIZE,
      1,
      MAX_PAGE_SIZE,
    );
    const category = params.category?.trim().toLowerCase();
    const q = params.q?.trim().toLowerCase();

    let filtered = PRODUCTS.filter((p) => p.isActive);

    if (category) {
      filtered = filtered.filter(
        (p) => (p.category ?? "").toLowerCase() === category,
      );
    }

    if (q) {
      filtered = filtered.filter((p) => {
        const haystack = `${p.name} ${p.sku} ${p.description ?? ""} ${p.category ?? ""}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      page: safePage,
      pageSize,
      total,
      totalPages,
    };
  },

  async findById(id: string): Promise<Product | null> {
    if (!id || typeof id !== "string") {
      return null;
    }
    const product = PRODUCTS.find((p) => p.id === id && p.isActive);
    return product ?? null;
  },
};
