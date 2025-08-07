import { it, expect } from 'vitest';
import { DirectoryExpander } from '../src';

it('DirectoryExpander', () => {
  const directoryExpander = new DirectoryExpander();
  expect(directoryExpander).toBeDefined();
});
