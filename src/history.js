// Bounded undo/redo for the Whiteboard: whole-`elements` snapshots (deep-cloned
// via JSON). Simpler than the per-layer pixel history of Paint because element
// arrays are small + serializable. Pure (no Vue).

export function createBoardHistory({ max = 60 } = {}) {
  let entries = [] // array of element-array snapshots (already cloned)
  let pointer = -1

  const clone = (els) => JSON.parse(JSON.stringify(els || []))

  return {
    // Record a new state. Truncates any redo tail, then caps the stack.
    push(els) {
      if (pointer < entries.length - 1) entries = entries.slice(0, pointer + 1)
      entries.push(clone(els))
      if (entries.length > max) entries.shift()
      else pointer += 1
      if (pointer > entries.length - 1) pointer = entries.length - 1
    },
    undo() {
      if (pointer <= 0) {
        pointer = Math.max(0, pointer - 1)
        return pointer >= 0 ? clone(entries[pointer]) : []
      }
      pointer -= 1
      return clone(entries[pointer])
    },
    redo() {
      if (pointer >= entries.length - 1) return null
      pointer += 1
      return clone(entries[pointer])
    },
    canUndo() {
      return pointer > 0
    },
    canRedo() {
      return pointer < entries.length - 1
    },
    reset() {
      entries = []
      pointer = -1
    },
    _state() {
      return { length: entries.length, pointer }
    },
  }
}
