export function shuffleArray(items) {
  const copiedItems = [...items];

  for (let i = copiedItems.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [copiedItems[i], copiedItems[randomIndex]] = [
      copiedItems[randomIndex],
      copiedItems[i],
    ];
  }

  return copiedItems;
}