export type HomeSectionCollapseState = {
  subPanel: boolean;
  userMenus: boolean;
  mobileDiscover: boolean;
  mobileStrip: boolean;
  favorites: boolean;
  popular: boolean;
  popularPosts: boolean;
  hotBoard: boolean;
};

export function createDefaultHomeSectionOpens(): HomeSectionCollapseState {
  return {
    subPanel: true,
    userMenus: true,
    mobileDiscover: true,
    mobileStrip: true,
    favorites: true,
    popular: true,
    popularPosts: true,
    hotBoard: true,
  };
}

export function setAllHomeSectionsOpen(
  open: boolean
): HomeSectionCollapseState {
  return {
    subPanel: open,
    userMenus: open,
    mobileDiscover: open,
    mobileStrip: open,
    favorites: open,
    popular: open,
    popularPosts: open,
    hotBoard: open,
  };
}

export function isAllHomeSectionsOpen(state: HomeSectionCollapseState): boolean {
  return Object.values(state).every(Boolean);
}
