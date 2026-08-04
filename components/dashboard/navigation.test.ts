import { describe, expect, it } from 'vitest';

import {
  getDashboardNavigationSections,
  isNavigationChildActive,
  isNavigationItemActive,
} from './navigation';

function sectionNamesFor(accountType: string) {
  return getDashboardNavigationSections(accountType).map((section) => section.title);
}

function itemNamesFor(accountType: string) {
  return getDashboardNavigationSections(accountType).flatMap((section) =>
    section.items.map((item) => item.name)
  );
}

describe('dashboard navigation sections', () => {
  it('shows placement navigation only for agency accounts', () => {
    expect(sectionNamesFor('AGENCY')).toContain('Placement');
    expect(sectionNamesFor('INDIVIDUAL')).not.toContain('Placement');
    expect(sectionNamesFor('COMPANY')).not.toContain('Placement');
  });

  it('includes the placement pipeline entry points for agency accounts', () => {
    expect(itemNamesFor('AGENCY')).toEqual(
      expect.arrayContaining([
        'Placement Pipeline',
        'Applications',
        'Viewings',
        'Landlords',
        'Mandates',
      ])
    );
  });

  it('only marks the matching placement item active', () => {
    const placementSection = getDashboardNavigationSections('AGENCY').find(
      (section) => section.title === 'Placement'
    );

    expect(placementSection).toBeDefined();

    const activeItems = placementSection!.items
      .filter((item) =>
        isNavigationItemActive(item, '/placement/mandates', placementSection!.items)
      )
      .map((item) => item.name);

    expect(activeItems).toEqual(['Mandates']);
  });

  it('keeps the placement pipeline active only on the placement root', () => {
    const placementSection = getDashboardNavigationSections('AGENCY').find(
      (section) => section.title === 'Placement'
    );
    const pipelineItem = placementSection!.items.find((item) => item.name === 'Placement Pipeline');

    expect(isNavigationItemActive(pipelineItem!, '/placement', placementSection!.items)).toBe(true);
    expect(
      isNavigationItemActive(pipelineItem!, '/placement/landlords', placementSection!.items)
    ).toBe(false);
  });

  it('marks only the most specific child active for nested navigation', () => {
    const communications = getDashboardNavigationSections('AGENCY').find(
      (section) => section.title === 'Communications'
    );
    const children = communications!.items[0]!.children!;

    const activeChildren = children
      .filter((child) => isNavigationChildActive(child, '/messages/automations', children))
      .map((child) => child.name);

    expect(activeChildren).toEqual(['Automations']);
  });
});
