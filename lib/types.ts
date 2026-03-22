export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  /** DB 마이그레이션 전에는 없을 수 있음 */
  stock?: number;
  image_url: string | null;
  created_at?: string;
};

export type CartItemRow = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
};
