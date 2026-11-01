import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateApartment } from '../src/schema/validate';

const projectsDir = join(import.meta.dirname, '..', 'public', 'projects');
const projectFiles = readdirSync(projectsDir).filter(
  (file) => file.endsWith('.json') && file !== 'index.json',
);

describe('project index', () => {
  it('lists exactly the project files', () => {
    const index = JSON.parse(readFileSync(join(projectsDir, 'index.json'), 'utf8')) as {
      projects: { id: string }[];
    };

    expect(index.projects.map((project) => `${project.id}.json`).sort()).toEqual(
      [...projectFiles].sort(),
    );
  });
});

describe('project files', () => {
  it.each(projectFiles)('%s is a valid apartment', (file) => {
    // Arrange
    const json: unknown = JSON.parse(readFileSync(join(projectsDir, file), 'utf8'));

    // Act
    const result = validateApartment(json);

    // Assert
    expect(result.success ? [] : result.errors).toEqual([]);
  });
});
