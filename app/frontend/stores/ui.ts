import { ref } from 'vue'
import { defineStore } from 'pinia'

export type Theme = 'light' | 'dark' | 'system'

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(false)
  const theme = ref<Theme>('light')
  const filtersOpen = ref(true)
  const collectorsOpen = ref(true)

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function closeSidebar() {
    sidebarOpen.value = false
  }

  function openSidebar() {
    sidebarOpen.value = true
  }

  function setTheme(value: Theme) {
    theme.value = value
  }

  function toggleFilters() {
    filtersOpen.value = !filtersOpen.value
  }

  function toggleCollectors() {
    collectorsOpen.value = !collectorsOpen.value
  }

  return {
    sidebarOpen,
    theme,
    filtersOpen,
    collectorsOpen,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    setTheme,
    toggleFilters,
    toggleCollectors
  }
})
