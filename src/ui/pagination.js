import { $ } from "./dom.js";

export function renderPage(prefix, items, page, revealItem = null) {
  const grid = items[0]?.parentElement;
  const minimumHeight =
    prefix === "food" || prefix === "supply"
      ? 112
      : 138;
  const rows = grid?.clientHeight
    ? Math.max(
        1,
        Math.min(3, Math.floor((grid.clientHeight + 7) / (minimumHeight + 7))),
      )
    : 3;
  const size = rows * 2;
  grid?.style.setProperty("--page-rows", rows);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const revealIndex = items.indexOf(revealItem);
  if (revealIndex >= 0) page = Math.floor(revealIndex / size);
  page = Math.max(0, Math.min(page, pages - 1));
  items.forEach((item, index) => {
    item.hidden = index < page * size || index >= (page + 1) * size;
  });
  $(`#${prefix}-prev`).disabled = page === 0;
  $(`#${prefix}-next`).disabled = page >= pages - 1;
  $(`#${prefix}-page`).textContent = `${page + 1} / ${pages} 页`;
  return page;
}
