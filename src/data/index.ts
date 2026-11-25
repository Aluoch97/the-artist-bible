import industryJson from './industry-data.json';
import redFlagsJson from './red-flags.json';
import type { IndustryData, RedFlag } from '../types/bible';

// Cast through the shared interfaces so JSON stays the single source of truth
// while components get strict types.
export const industryData = industryJson as IndustryData;
export const redFlags = redFlagsJson as RedFlag[];
