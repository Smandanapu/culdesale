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
  },
  {
    id: 'suv_honda_pilot',
    make: 'Honda',
    model: 'Pilot (Seats Down)',
    type: 'SUV',
    dimensions: [83, 48, 33],
    icon: '🚙'
  },
  {
    id: 'suv_toyota_highlander',
    make: 'Toyota',
    model: 'Highlander (Seats Down)',
    type: 'SUV',
    dimensions: [81, 45, 31],
    icon: '🚙'
  },
  {
    id: 'suv_hyundai_santafe',
    make: 'Hyundai',
    model: 'Santa Fe (Seats Down)',
    type: 'SUV',
    dimensions: [76, 42, 31],
    icon: '🚙'
  },
  {
    id: 'suv_honda_crv',
    make: 'Honda',
    model: 'CR-V (Seats Down)',
    type: 'SUV',
    dimensions: [73, 41, 33],
    icon: '🚙'
  },
  {
    id: 'suv_benz_glc300',
    make: 'Mercedes-Benz',
    model: 'GLC 300 (Seats Down)',
    type: 'SUV',
    dimensions: [68, 43, 29],
    icon: '🚙'
  },
  {
    id: 'suv_bmw_x5',
    make: 'BMW',
    model: 'X5 (Seats Down)',
    type: 'SUV',
    dimensions: [74, 43, 31],
    icon: '🚙'
  }
]
