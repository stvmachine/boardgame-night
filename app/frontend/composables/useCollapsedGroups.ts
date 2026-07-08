import { computed, ref } from 'vue'

export function useCollapsedGroups(initialGroupNames: string[] = []) {
  const collapsed = ref<Set<string>>(new Set())

  function isCollapsed(name: string): boolean {
    return collapsed.value.has(name)
  }

  function toggle(name: string) {
    const next = new Set(collapsed.value)
    if (next.has(name)) {
      next.delete(name)
    } else {
      next.add(name)
    }
    collapsed.value = next
  }

  function expandAll(names: string[]) {
    collapsed.value = new Set([...collapsed.value].filter(name => !names.includes(name)))
  }

  function collapseAll(names: string[]) {
    collapsed.value = new Set([...collapsed.value, ...names])
  }

  const allCollapsed = computed(() => {
    if (initialGroupNames.length === 0) return false
    return initialGroupNames.every(name => collapsed.value.has(name))
  })

  return {
    collapsed,
    isCollapsed,
    toggle,
    expandAll,
    collapseAll,
    allCollapsed
  }
}
