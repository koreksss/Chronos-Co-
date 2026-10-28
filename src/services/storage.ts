
const STORAGE_URL =
  "https://xkvlpbxsahrgadbhrbge.supabase.co/storage/v1/object/public/product-images";

export function getProductImageUrl(image: string): string {
  const filename = image.replace(/\.(jpg|jpeg)$/i, ".png");
  return `${STORAGE_URL}/${filename}`;
}
