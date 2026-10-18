import { foodById } from "../../content/catalog.js";

const bowl = (fill, inside = "") =>
  `<ellipse cx="40" cy="35" rx="29" ry="10" fill="#faf1d5"/><path d="M11 35h58c-2 21-15 27-29 27S13 56 11 35Z" fill="${fill}"/>${inside}`;
const seeds = (color) =>
  [22, 32, 42, 52]
    .map(
      (x, i) =>
        `<ellipse cx="${x}" cy="${30 + (i % 2) * 6}" rx="5" ry="3" fill="${color}" stroke="none"/>`,
    )
    .join("");
const leaves = `<path d="M39 59V26M39 43C14 43 12 20 22 15c17 1 19 17 17 28ZM40 47c21-2 31-22 22-32-16 0-22 17-22 32Z" fill="#9dbb7e"/>`;
function illustration(art) {
  switch (art) {
    case "potato":
      return `<ellipse cx="40" cy="38" rx="29" ry="20" transform="rotate(-18 40 38)" fill="#d5b77e"/><path d="m25 31 3 1m15-7 3 1m8 17 3-1m-23 8 3 1" stroke="#a88e60" stroke-width="3" stroke-linecap="round"/>`;
    case "beetroot":
      return `<path d="M40 29Q18 0 28 6q13 2 13 23Q44 2 56 8q2 14-16 21" fill="#89a86f"/><path d="M16 38c0-21 48-21 48 0 0 20-21 28-24 33-4-8-24-14-24-33Z" fill="#b96e80"/><path d="M24 36q2-9 10-8" stroke="#e3a4b1" stroke-width="4" fill="none"/>`;
    case "burger":
      return `<path d="M12 26C14 6 66 6 68 26Z" fill="#e9b475"/><path d="M11 32l12-4 13 5 12-5 20 4" fill="none" stroke="#89a76c" stroke-width="7"/><rect x="12" y="38" width="56" height="9" rx="4" fill="#9e7055"/><path d="m15 47 20 9 13-9" fill="#f4d17d"/><path d="M13 51h54v4c0 14-54 14-54 0Z" fill="#e9b475"/><path d="m25 18 3 1m11-5 2 2m12 1 3 1" stroke="#fff3c9" stroke-width="3"/>`;
    case "mushroom":
      return `<path d="m22 58 3-29m15 31V23m16 34-2-24" fill="none" stroke="#e1d1ac" stroke-width="7"/><path d="M12 28c0-18 26-18 26 0ZM27 22c0-21 27-21 27 0ZM43 32c0-17 25-17 25 0Z" fill="#f7eacb"/>`;
    case "noodles":
      return bowl(
        "#d9a16e",
        `<path d="M18 32q8-22 16 0t16 0 15 0M21 27q8-19 16 0t16 0" fill="none" stroke="#ead17c" stroke-width="4"/><path d="m48 7 19 30m-13-32 17 29" stroke="#a17b59"/>`,
      );
    case "hotpot":
      return `<path d="M8 35H2v14h9m58-14h9v14h-9" fill="none"/>${bowl("#c88465", '<ellipse cx="40" cy="35" rx="26" ry="8" fill="#d59a73"/><path d="m24 33 6-7 8 7m7 0 7-6 6 5" fill="#abc18b"/>')}<path d="M28 20q-6-8 0-15m16 14q-6-8 0-15m13 16q-6-8 0-15" fill="none" stroke="#c3c9ae"/>`;
    case "wing":
      return `<path d="m44 42 18 12m-2-4q15-3 10 9-5 12-13 1" fill="#f7edcf"/><path d="M14 45C2 26 29 8 45 19c21 13 4 43-15 40Z" fill="#d29a60"/><path d="m19 34 8-8m-3 20 10-11" stroke="#eec48b" stroke-width="4"/>`;
    case "durian":
      return `<path d="m12 35 6-11 2-9 12 1 10-8 9 8 12 1 1 12 8 11-10 9-5 12-12-2-12 5-7-10-12-5 3-10Z" fill="#a8b47b"/><path d="M40 19c-22 12-22 35 0 40 21-9 23-33 0-40Z" fill="#f1d590"/><path d="M40 25v27" fill="none" stroke="#d4b875"/>`;
    case "rice":
      return bowl(
        "#d8b18b",
        '<path d="M16 33c-4-17 11-23 20-15 7-15 27-7 23 5 9-4 15 4 7 11Z" fill="#fff8df"/>',
      );
    case "brown-rice":
      return bowl("#c7ad88", seeds("#b69770"));
    case "oats":
      return bowl("#b5c49e", seeds("#dcc594"));
    case "red-beans":
      return bowl("#d5b18e", seeds("#a97568"));
    case "chickpeas":
      return bowl("#b5c49e", seeds("#d7bd85"));
    case "toast":
    case "wholewheat":
      return `<path d="M15 31C1 13 27 3 40 10c18-8 42 8 26 23v28H15Z" fill="${art === "toast" ? "#ddb27a" : "#bb986d"}"/><path d="M23 31C12 20 29 12 40 18c13-6 30 6 18 15v21H23Z" fill="${art === "toast" ? "#f7dfad" : "#dec79b"}"/>${art === "wholewheat" ? seeds("#a98a63") : ""}`;
    case "corn":
      return `<path d="M26 18c0-15 28-15 28 0v27c0 22-28 22-28 0Z" fill="#edce78"/><path d="M33 15v33m8-34v35m8-32v29M26 24h28M26 34h28M27 44h26" stroke="#d4b467" stroke-width="1.5"/><path d="M38 62C14 58 10 36 15 27c19 6 21 24 23 35Zm3 0c20-7 28-23 26-35-20 9-21 23-26 35Z" fill="#a6be80"/>`;
    case "sweet-potato":
      return `<ellipse cx="39" cy="35" rx="29" ry="17" transform="rotate(-30 39 35)" fill="#af7e72"/><path d="M20 41c1-16 23-28 36-19" fill="none" stroke="#d8a07c" stroke-width="5"/><path d="m26 44 3 2m14-14 3 1" stroke="#eed3a3"/>`;
    case "broccoli":
      return `<path d="M31 36 28 61h24L47 35" fill="#c1d399"/><path d="M27 39C5 41 8 20 21 20 18 6 37 3 42 14c12-14 29-1 23 10 16 12-3 26-18 14Z" fill="#98b97d"/><path d="m32 31 7 12 10-13M39 43v14" fill="none"/>`;
    case "celery":
    case "spinach":
      return leaves;
    case "pumpkin":
      return `<path d="M37 16q-1-12 10-12l1 12" fill="#8ea16b"/><ellipse cx="40" cy="40" rx="30" ry="23" fill="#dfb477"/><ellipse cx="40" cy="40" rx="17" ry="23" fill="#edc488"/><path d="M40 19v42" stroke="#d5a364"/>`;
    case "almonds":
      return `<path d="M12 47c0-17 12-26 19-28 13 15 10 35-5 41-9 1-14-5-14-13ZM43 58c-3-14 4-31 14-37 17 10 17 28 5 39-7 4-16 3-19-2Z" fill="#b99872"/><path d="m23 51 5-23m24 26 5-21" stroke="#d9bd94"/>`;
    case "kiwi":
      return `<ellipse cx="34" cy="38" rx="23" ry="25" fill="#ad9876"/><ellipse cx="44" cy="37" rx="23" ry="25" fill="#b3c77e"/><ellipse cx="44" cy="37" rx="8" ry="12" fill="#f4ebc2"/><path d="m30 25 3 3m21-3-3 3M29 40h4m22 0h4m-25 12 2-3m16 3-2-3" stroke="#7d8c5a"/>`;
    case "apple":
      return `<path d="M40 20c-25-17-39 9-27 32 11 18 18 7 27 9 12 6 23-2 27-20 5-22-14-29-27-21Z" fill="#d79d8d"/><path d="M40 20q-3-12 4-16" fill="none"/><path d="M44 13q7-14 20-7-5 15-20 7Z" fill="#a1b77e"/><path d="M23 30q-7 8-3 15" stroke="#f0c5ad" stroke-width="4" fill="none"/>`;
    case "pear":
      return `<path d="M30 20c-2 12-20 17-16 33 6 19 47 19 53 0 4-17-16-23-18-35-3-17-19-13-19 2Z" fill="#d3cc8c"/><path d="M39 11q-3-10 5-12" fill="none"/><path d="M25 40q-6 8-2 13" stroke="#eee5b4" stroke-width="4" fill="none"/>`;
    case "prune":
      return `<ellipse cx="29" cy="40" rx="18" ry="23" fill="#a298ad"/><ellipse cx="52" cy="37" rx="18" ry="24" fill="#8d849f"/><path d="M51 16q-1-11 7-13" fill="none"/><path d="M43 25q-6 8-5 17" stroke="#bdb4c8" stroke-width="4" fill="none"/>`;
    case "dragon-fruit":
      return `<path d="M14 22c-1 35 13 45 30 40 21-5 27-27 20-43Z" fill="#d794a8"/><path d="M21 25c0 27 9 33 22 29 14-4 19-16 17-29Z" fill="#f8e4e5"/><path d="m25 13 8 11m17-17-6 16m20-9-9 11" stroke="#a1b67e" stroke-width="5"/><g fill="#997c85" stroke="none"><circle cx="32" cy="34" r="1.6"/><circle cx="46" cy="34" r="1.6"/><circle cx="40" cy="46" r="1.6"/><circle cx="52" cy="42" r="1.6"/></g>`;
    case "banana":
      return `<path d="M13 21c7 28 29 30 47-1l8 3C56 66 20 77 9 35Z" fill="#ead28a"/><path d="M17 34c9 20 28 17 42-3" fill="none" stroke="#f7e6a8" stroke-width="5"/><path d="m60 20 2-8 8 4-2 7" fill="#a9ad78"/>`;
    case "egg":
      return `<path d="M40 5C23 5 10 34 15 48c6 23 44 23 50 0C70 34 57 5 40 5Z" fill="#fff9e9"/><ellipse cx="40" cy="43" rx="15" ry="16" fill="#edce7c" stroke="#dcba71"/>`;
    case "cheese":
      return `<path d="m10 28 37-17 22 30v20H10Z" fill="#edce81"/><path d="m10 28 36 13h23M46 41v20" fill="none"/><circle cx="25" cy="44" r="5" fill="#d9b56d"/><circle cx="57" cy="50" r="4" fill="#d9b56d"/>`;
    case "yogurt":
      return `<path d="m18 20 5 42h34l5-42Z" fill="#f8f4e5"/><path d="m20 34 3 22h34l3-22" fill="#c7d8ca"/><ellipse cx="40" cy="20" rx="25" ry="8" fill="#e4eadb"/><path d="m54 15 11-12" stroke="#b6bba9" stroke-width="4"/>`;
    case "ice-cream":
      return `<path d="m23 31 17 34 17-34Z" fill="#d9b584"/><path d="m28 34 17 21m-8-21 12 14m-17 6 17-20" stroke="#be976b" stroke-width="1.5"/><path d="M15 28c-4-14 8-23 20-20 16-11 37 5 27 21Z" fill="#e6bbc4"/>`;
    case "guanyin-clay":
      return `<path d="m9 45 8-19 20-7 15 9 2 26-24 9Z" fill="#c7bda6"/><path d="m38 42 13-20 16 4 8 23-17 13-20-5Z" fill="#d7ccb4"/><path d="m18 29 13 10 14-9M31 39l-3 16m23-27 7 13 12 4m-12-4-8 13" fill="none" stroke="#ab9f89"/><path d="m15 59 5 2m46 2 5-3" stroke="#c7bda6" stroke-width="4"/>`;
    case "century-egg":
      return `<path d="M30 9C15 10 7 33 12 47c5 17 31 18 37 1C55 34 44 8 30 9Z" fill="#9c9376"/><path d="M48 13C34 15 26 37 31 51c6 17 31 17 36 0C72 36 61 11 48 13Z" fill="#827e67"/><path d="M48 20c-10 2-17 21-13 31 4 12 24 12 28-1 4-11-6-32-15-30Z" fill="#5c6559"/><ellipse cx="49" cy="43" rx="10" ry="12" fill="#a8b58c"/><path d="m39 29 3 5m15-4-3 4" stroke="#bbc5a3"/>`;
    case "stinky-tofu":
      return `<ellipse cx="40" cy="57" rx="32" ry="9" fill="#e7e5ce"/><path d="m12 33 20-7 15 11-19 9-16-5Z" fill="#797563"/><path d="m12 41 16 5 19-9v17l-19 9-16-7Z" fill="#686b5a"/><path d="m41 29 18-5 12 10-18 8-12-6Z" fill="#8b8268"/><path d="m41 36 12 6 18-8v17l-18 8-12-9Z" fill="#72715c"/><path d="m20 34 8 2m22-4 9 2" stroke="#bbaa78"/><path d="M24 20q-7-7 0-13m19 13q-7-7 0-13m18 11q-7-7 0-13" fill="none" stroke="#b3bc9a"/>`;
    case "natto":
      return bowl(
        "#b7c6a3",
        `${seeds("#bd9b64")}<path d="m21 31 7-14 10 15 10-16 12 16" fill="none" stroke="#eddfb4" stroke-width="1.5"/><path d="m36 14 27-8m-24 13L67 9" stroke="#b4936f" stroke-width="3"/><ellipse cx="35" cy="17" rx="5" ry="3" fill="#c9a46a"/><path d="m25 29 4 2m15-6 5 2" stroke="#90a573" stroke-width="3"/>`,
      );
    case "kimchi":
      return `<ellipse cx="40" cy="55" rx="33" ry="10" fill="#e9e6cf"/><path d="M16 49C12 35 19 14 29 13c9 5 8 17 13 19 4-9 14-15 22-8-2 13-10 28-24 33Z" fill="#d99877"/><path d="M23 46c-4-15 4-24 7-25 3 13 7 17 15 21m-13 8c9-7 18-8 25-18" fill="none" stroke="#f0d19b" stroke-width="5"/><path d="m21 30 9 4m-4 6 11-1m7 7 8 3m-2-13 8 1" stroke="#bd775f"/><path d="m20 18 7-6 5 6m24 7 8-3 1 6" fill="#aaba85"/>`;
    case "konjac":
      return `<ellipse cx="40" cy="55" rx="32" ry="10" fill="#d5dfca"/><path d="M16 31c7-17 37-15 46-2 10 16-13 27-31 24-21-3-21-21-4-25 15-4 25 10 15 18-9 8-23 1-17-8 5-8 22-8 25-16" fill="none" stroke="#b7b59d" stroke-width="12"/><path d="M16 31c7-17 37-15 46-2 10 16-13 27-31 24-21-3-21-21-4-25 15-4 25 10 15 18-9 8-23 1-17-8 5-8 22-8 25-16" fill="none" stroke="#e8e4cd" stroke-width="8"/><path d="m28 18 5-5m22 40 5 2" stroke="#e8e4cd" stroke-width="4"/>`;
    case "okra":
      return `<path d="M13 55c4-19 17-38 32-44l5 5C43 36 31 53 17 59Z" fill="#a1b77b"/><path d="m20 49 22-30" stroke="#cfdaa7" stroke-width="3"/><path d="m44 11 4-6 7 5-5 6" fill="#8fa371"/><path d="m45 35 8-7 10 3 6 10-3 13-11 7-12-5-4-11Z" fill="#93aa77"/><path d="m48 39 6-5 7 3 2 8-5 8-9-3-3-6Z" fill="#e1e5b8"/><g fill="#a8b77f" stroke="none"><circle cx="54" cy="40" r="2"/><circle cx="59" cy="45" r="2"/><circle cx="53" cy="49" r="2"/><circle cx="49" cy="44" r="2"/></g>`;
    case "bamboo-shoots":
      return `<path d="M40 8C25 22 15 41 12 58c16 11 38 11 55 0C63 38 55 20 40 8Z" fill="#d0bb8b"/><path d="M40 8c-3 18-8 35-17 52m17-52c4 19 10 37 18 52" fill="none" stroke="#eee0b5" stroke-width="5"/><path d="m27 26 13 5 13-5m-33 15 20 6 21-6m-45 14 24 6 25-6" fill="none" stroke="#aa9c73"/><path d="m15 47-7 7 6 6m49-19 9 9-5 8" fill="#b5b782"/>`;
    case "seaweed":
      return `<ellipse cx="40" cy="57" rx="32" ry="8" fill="#e3e6d1"/><path d="M17 14c13 1 10 18 20 22S65 43 59 55 30 59 32 44 54 13 64 16" fill="none" stroke="#718d6b" stroke-width="13"/><path d="M17 14c13 1 10 18 20 22S65 43 59 55 30 59 32 44 54 13 64 16" fill="none" stroke="#93a783" stroke-width="6"/><path d="m18 11-6 4 8 7m43-10 6 6-9 7" fill="#829b76"/>`;
    case "black-sesame":
      return bowl(
        "#d5c3a7",
        `<ellipse cx="40" cy="34" rx="26" ry="8" fill="#77766c"/><path d="M20 34c9-7 31-7 39 0-8 5-23 5-27 1 0-4 15-4 15-1" fill="none" stroke="#9a9888" stroke-width="2"/><path d="m28 28 2 1m9-2 2 1m9 1 2 1m-7 8 2 1" stroke="#e9ddbb" stroke-width="2"/><path d="m60 27 10-16" stroke="#abac98" stroke-width="5"/>`,
      );
    case "squid-ink-pasta":
      return `<ellipse cx="39" cy="49" rx="34" ry="16" fill="#e6e4ce"/><ellipse cx="39" cy="47" rx="27" ry="10" fill="#929587"/><path d="M15 46q8-20 16 0t16 0 16 0M20 43q8-20 16 0t16 0 13 0M24 49q9-17 18 0t16-1" fill="none" stroke="#5f6c60" stroke-width="4"/><path d="M45 37c-9-16 11-12 6-25m-4 0h13m-11-7v12m5-12v12m5-12v12" fill="none" stroke="#a1a68f" stroke-width="3"/><path d="m24 39 7-5 6 4" fill="#a1b87d"/>`;
    case "spicy-crayfish":
      return `<ellipse cx="40" cy="55" rx="33" ry="10" fill="#e6e3cc"/><path d="M45 19c-19-4-34 13-24 27 7 10 24 9 29-1" fill="none" stroke="#b77560" stroke-width="13"/><path d="M45 19c-19-4-34 13-24 27 7 10 24 9 29-1" fill="none" stroke="#d99a76" stroke-width="8"/><path d="m19 32 9 3m-7 9 9-3m1 11 3-10m10 8-4-8" stroke="#a87460"/><path d="m46 20 10-9 2 11-10 7m-5-7 1-15-9 7 2 12m7 18 12 8 5-8-12-8" fill="#d79573"/><path d="m49 28 14-4m-15 7 18 1m-37 12-9 10m15-6-4 12" fill="none" stroke-width="1.5"/><circle cx="47" cy="26" r="2" fill="#675e50" stroke="none"/>`;
    case "duck-blood":
      return bowl(
        "#b3c4a3",
        `<ellipse cx="40" cy="34" rx="26" ry="8" fill="#d9bc8e"/><path d="M20 34q7-16 14 0t14 0 14 0m-36-5q8-11 15 2t15-1" fill="none" stroke="#f2dfac" stroke-width="3"/><path d="m23 26 11-3 5 8-12 3Zm22 2 11-3 6 8-12 3Z" fill="#9e7770"/><path d="m21 39 7-4m18-10 5-5m6 17 6-3" stroke="#91a574" stroke-width="3"/><path d="m57 20 11-15m-7 18L73 8" stroke="#aa8c6a"/>`,
      );
    case "pig-blood-cake":
      return `<path d="m48 43 17 20" stroke="#b89a72" stroke-width="5"/><path d="m13 24 24-15 28 32-24 16Z" fill="#8b7967"/><path d="m13 24 28 32v7L13 31Zm28 32 24-16v7L41 63Z" fill="#746d5b"/><path d="m24 23 6 1m5-6 5 2m-9 11 6 1m8-5 5 2m-9 11 6 2m7-5 3 3" stroke="#d7bc87" stroke-width="3"/><path d="m21 18 5-5 4 5m12 8 4-5 5 3m-17 8 6-5 3 5m6 11 5-5 4 4" fill="#a0b77d"/>`;
    case "fried-insects":
      return `<ellipse cx="40" cy="54" rx="33" ry="11" fill="#e3e3ca"/><g transform="rotate(-24 30 34)"><ellipse cx="30" cy="36" rx="8" ry="17" fill="#c6a26d"/><path d="M30 23v26m-6-17 12 1m-13 6 13 1m-14-8-9-6m10 13-12 1m11 5-8 8m23-20 10-6m-10 13 12 1m-13 5 8 8" fill="none" stroke="#a48c62"/><circle cx="30" cy="17" r="6" fill="#b89b68"/><path d="m27 12-4-6m10 6 4-6" fill="none"/></g><g transform="translate(34 9) rotate(18 21 28)"><ellipse cx="21" cy="31" rx="6" ry="13" fill="#ddbc81"/><path d="M21 22v18m-5-12-8-5m8 11-9 2m10 3-6 8m15-19 8-5m-8 11 9 2m-10 3 6 8" fill="none" stroke="#a48c62"/><circle cx="21" cy="16" r="5" fill="#c6a26d"/></g>`;
    case "cactus":
      return `<ellipse cx="40" cy="56" rx="33" ry="10" fill="#e5e6ce"/><path d="M36 52V18c0-13 17-13 17 0v15h5V22c0-9 13-9 13 0v16c0 8-9 8-18 8v6Z" fill="#9eb783"/><path d="M36 35h-9V22c0-8-13-8-13 0v15c0 8 12 10 22 10" fill="#a9bf8a"/><path d="m42 15 3 2m-5 10 3 2m2 10 3-2m15-12 2 2m-44-3 2 2m0 10 2 2" stroke="#d4dfac"/><path d="m16 53 9-7 10 6-10 8Zm31 3 8-6 9 5-7 6Z" fill="#c2cf9c"/><path d="m24 49 2 5m28 0 2 3" stroke="#89a173"/>`;
    case "rose-cake":
      return `<ellipse cx="40" cy="57" rx="31" ry="9" fill="#e9e4cd"/><path d="M14 34c0-23 52-23 52 0v15c0 18-52 18-52 0Z" fill="#d9b98a"/><ellipse cx="40" cy="34" rx="26" ry="20" fill="#efd4a2"/><path d="M24 25q-5 8-1 16m34-16q5 8 1 16" fill="none" stroke="#dab783"/><path d="M40 41c-16 1-18-11-10-13-2-11 13-14 17-6 12-2 17 10 8 14-1 9-13 13-15 5Z" fill="#d6a0ab"/><path d="M40 38c-10 0-11-9-4-10 6-8 16-1 11 5-5 5-10 1-7-2" fill="none" stroke="#b98494"/><path d="m23 48 7-5 5 5" fill="#a8b985"/>`;
    case "popping-chocolate":
      return `<path d="m11 31 38-15 20 28-39 17-19-23Z" fill="#9a7a64"/><path d="m11 31 38-15 20 21-39 17Z" fill="#b28b70"/><path d="m24 26 20 22m-7-27 20 22M20 41l38-15" fill="none" stroke="#896d59" stroke-width="3"/><g stroke-width="1.5"><circle cx="24" cy="29" r="3" fill="#e3b7ba"/><circle cx="39" cy="38" r="3" fill="#b1c798"/><circle cx="52" cy="30" r="3" fill="#e8cd82"/><path d="m18 13 3-6 2 6 6 2-6 2-2 6-3-6-6-2Zm39-2 2-5 2 5 5 2-5 2-2 5-2-5-5-2Z" fill="#e9d99b"/><path d="m68 25 4-3m-34-9 1-4" stroke="#b9a8c0" stroke-width="3"/></g>`;
    case "rainbow-crayon":
      return `<g transform="rotate(-22 26 37)"><path d="m18 19 8-14 8 14v41H18Z" fill="#dca2a6"/><path d="m18 19 8-14 8 14Z" fill="#b87585"/><path d="M18 29h16v20H18Z" fill="#f0d2c7"/><path d="m22 34 8 9m-8-3 8-9" stroke="#c88e99"/></g><g><path d="m32 20 8-15 8 15v42H32Z" fill="#e3c680"/><path d="m32 20 8-15 8 15Z" fill="#c6a461"/><path d="M32 30h16v20H32Z" fill="#f3e4bb"/><path d="m36 35 8 9m-8-3 8-9" stroke="#c5ad70"/></g><g transform="rotate(22 55 38)"><path d="m47 20 8-14 8 14v41H47Z" fill="#a8c3b5"/><path d="m47 20 8-14 8 14Z" fill="#7eaa9c"/><path d="M47 30h16v20H47Z" fill="#dce8d4"/><path d="m51 35 8 9m-8-3 8-9" stroke="#8bac9c"/></g>`;
    case "marshmallow-foam":
      return `<ellipse cx="40" cy="58" rx="31" ry="8" fill="#e8e4d3"/><path d="M17 47C3 40 8 22 20 23 17 8 37 3 44 15c12-13 29-1 23 11 14 8 6 25-7 23-6 15-25 15-30 5-8 6-17 2-13-7Z" fill="#e8c6d0"/><path d="M20 43c-4-10 3-15 10-12-4-12 13-20 19-9 10-2 17 7 12 14 11 9-4 21-13 15-8 11-23 5-23-4Z" fill="#d9e3de"/><path d="M31 33c4-9 17-8 18 1m-15 9c6 6 17 4 20-2" fill="none" stroke="#f8f0df" stroke-width="4"/><circle cx="13" cy="12" r="3" fill="#f2ddb8"/><circle cx="70" cy="53" r="3" fill="#c3cfba"/>`;
    case "meteor-cookie":
      return `<path d="m10 28 7-14 15-5 12 4 11-1 12 13 5 15-9 17-16 7-17-4-15-4-6-14Z" fill="#95978c"/><path d="m16 30 6-12 11-3 11 4 10-1 8 9 4 13-8 12-13 5-14-3-12-3-5-11Z" fill="#aca99a"/><ellipse cx="30" cy="30" rx="8" ry="6" fill="#85897c"/><ellipse cx="51" cy="43" rx="10" ry="8" fill="#8f9181"/><ellipse cx="27" cy="47" rx="4" ry="3" fill="#7f8577"/><path d="m27 27 6 1m13 11 8 1" stroke="#c7c2ab" stroke-width="2"/><path d="m57 8 2-6 2 6 6 2-6 2-2 6-2-6-6-2ZM12 57l2-5 2 5 5 2-5 2-2 5-2-5-5-2Z" fill="#e5d093" stroke="#bcae80"/>`;
    default:
      return bowl("#d8b18b", seeds("#fff5d8"));
  }
}
export function foodArt(id) {
  const art = foodById[id]?.art || "rice";
  return `<svg viewBox="0 0 80 72" aria-hidden="true" focusable="false"><ellipse cx="40" cy="65" rx="26" ry="4" fill="#dce3cd" opacity=".5"/><g stroke="#8d9277" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${illustration(art)}</g></svg>`;
}
