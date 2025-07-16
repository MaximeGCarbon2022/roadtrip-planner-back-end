// Randomize the order of countries
export default function randomizeOrder(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  const orderArray = Array.from({ length: ids.length }, (_, i) => i + 1);

  // Fisher-Yates shuffle
  for (let i = orderArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [orderArray[i], orderArray[j]] = [orderArray[j], orderArray[i]];
  }

  return ids.map((cca3, index) => ({
    cca3: cca3,
    order: orderArray[index],
  }));
}
