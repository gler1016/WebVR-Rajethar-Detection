interface ObjectConfig {
  classId: number;
  name: string;
  unitDimensions?: { width: number; height: number };
  depthFactor?: number;
}

export const objectConfigs: ObjectConfig[] = [
  {
    classId: 1,
    name: 'Radiator',
    unitDimensions: { width: 85.60, height: 53.98 },
    depthFactor: 0.8
  },
  // You can add more objects like windows, doors here
];
