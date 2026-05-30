// Common car models and their approximate cargo dimensions in inches
// [Length, Width, Height]
export const CAR_DIMENSIONS = [
  {
    id: 'sedan_compact',
    make: 'Honda',
    model: 'Civic (Trunk)',
    type: 'Sedan',
    dimensions: [34, 40, 20], // depth, width, height of trunk opening
    icon: '🚗'
  },
  {
    id: 'sedan_midsize',
    make: 'Toyota',
    model: 'Camry (Trunk)',
    type: 'Sedan',
    dimensions: [38, 42, 21],
    icon: '🚗'
  },
  {
    id: 'suv_compact',
    make: 'Toyota',
    model: 'RAV4 (Seats Down)',
    type: 'SUV',
    dimensions: [73, 41, 33],
    icon: '🚙'
  },
  {
    id: 'suv_midsize',
    make: 'Tesla',
    model: 'Model Y (Seats Down)',
    type: 'SUV',
    dimensions: [78, 37, 27],
    icon: '🔋'
  },
  {
    id: 'suv_large',
    make: 'Chevrolet',
    model: 'Tahoe (Seats Down)',
    type: 'SUV',
    dimensions: [89, 49, 34],
    icon: '🚙'
  },
  {
    id: 'truck_short',
    make: 'Toyota',
    model: 'Tacoma (5ft Bed)',
    type: 'Truck',
    dimensions: [60, 41, 19], // length, width between wheel wells, height of bed walls
    icon: '🛻'
  },
  {
    id: 'truck_standard',
    make: 'Ford',
    model: 'F-150 (6.5ft Bed)',
    type: 'Truck',
    dimensions: [78, 50, 21],
    icon: '🛻'
  },
  {
    id: 'hatchback',
    make: 'Volkswagen',
    model: 'Golf (Seats Down)',
    type: 'Hatchback',
    dimensions: [60, 39, 27],
    icon: '🏎️'
  },
  {
    id: 'minivan',
    make: 'Honda',
    model: 'Odyssey (Seats Removed)',
    type: 'Minivan',
    dimensions: [96, 48, 45],
    icon: '🚐'
  }
]
