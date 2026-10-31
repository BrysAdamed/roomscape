import type { Apartment } from '../schema/apartment';

const PRIMITIVE_ARRAY =
  /\[\s*((?:-?[\d.e+-]+|"[^"]*"|true|false|null)(?:,\s*(?:-?[\d.e+-]+|"[^"]*"|true|false|null))*)\s*\]/g;

export function serializeApartment(apartment: Apartment): string {
  const json = JSON.stringify(apartment, null, 2);
  return `${json.replace(PRIMITIVE_ARRAY, (_, items: string) => `[${items.split(/,\s*/).join(', ')}]`)}\n`;
}

export function downloadApartment(apartment: Apartment): void {
  const blob = new Blob([serializeApartment(apartment)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${apartment.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
