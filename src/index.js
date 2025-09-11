export const play =
  (...actions) =>
  async (input = {}) => {
    let current = input

    for (const action of actions) {
      current = await action(current)
    }

    return current
  }
