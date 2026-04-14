declare module '@liberty-rider/flexpolyline' {
  export function decode(encoded: string): {
    polyline: [number, number][];
    precision?: number;
  };
}