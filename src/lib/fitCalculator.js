/**
 * Checks if an item (L, W, H) can fit into a container (cL, cW, cH).
 * Since the item can be rotated in 3D space in 90-degree increments,
 * there are 6 possible orientations (permutations of the 3 dimensions).
 */
export function canItFit(itemDimensions, carDimensions) {
  if (!itemDimensions || itemDimensions.length !== 3) return false
  if (!carDimensions || carDimensions.length !== 3) return false

  const [il, iw, ih] = itemDimensions
  // Sort container dimensions largest to smallest to make it easier
  const container = [...carDimensions].sort((a, b) => b - a)

  // All 6 permutations of item dimensions
  const orientations = [
    [il, iw, ih],
    [il, ih, iw],
    [iw, il, ih],
    [iw, ih, il],
    [ih, il, iw],
    [ih, iw, il]
  ]

  for (const orientation of orientations) {
    // Check if this orientation fits inside the container
    // We sort the orientation dimensions and container dimensions 
    // to check if it fits in ANY matching axis orientation.
    // Actually, sorting both largest-to-smallest and comparing them pairwise is mathematically sufficient
    // for a simple orthogonal bounding-box check!
    const sortedItem = [...orientation].sort((a, b) => b - a)
    
    if (
      sortedItem[0] <= container[0] &&
      sortedItem[1] <= container[1] &&
      sortedItem[2] <= container[2]
    ) {
      return true
    }
  }

  return false
}
