import { z } from 'zod';
import type { Apartment } from '../schema/apartment';
import { validateApartment } from '../schema/validate';

const indexSchema = z.object({
  projects: z.array(z.object({ id: z.string(), description: z.string().optional() })),
});

export type ProjectIndex = z.infer<typeof indexSchema>;

export type LoadResult =
  { success: true; apartment: Apartment } | { success: false; errors: string[] };

export async function fetchProjectIndex(signal?: AbortSignal): Promise<ProjectIndex> {
  const response = await fetch('projects/index.json', { signal });
  if (!response.ok) {
    throw new Error(`Could not load the project list (${response.status})`);
  }
  return indexSchema.parse(await response.json());
}

export async function fetchApartment(projectId: string, signal?: AbortSignal): Promise<LoadResult> {
  const response = await fetch(`projects/${projectId}.json`, { signal });
  if (!response.ok) {
    return {
      success: false,
      errors: [`Could not load project '${projectId}' (${response.status})`],
    };
  }
  return validateApartment(await response.json());
}

export function parseApartmentFile(text: string): LoadResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    return { success: false, errors: [`Not a JSON file: ${(error as Error).message}`] };
  }
  return validateApartment(json);
}
