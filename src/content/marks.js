// Food signatures sit on top of shape, pigment and rare material.
export const outcomeMarks = {
  enoki: {
    name: "金针菇印记",
    description: "See you tomorrow，金针菇这次准时出现。",
  },
};

export function normalizeMarks(value) {
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (id) => typeof id === "string" && Object.hasOwn(outcomeMarks, id),
          ),
        ),
      ].sort()
    : [];
}
