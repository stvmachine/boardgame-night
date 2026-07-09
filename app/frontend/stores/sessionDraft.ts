import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSessionDraftStore = defineStore('sessionDraft', () => {
  const title = ref('')
  const description = ref('')
  const scheduledAt = ref<string | null>(null)
  const location = ref('')
  const capacity = ref<number | null>(null)

  function reset() {
    title.value = ''
    description.value = ''
    scheduledAt.value = null
    location.value = ''
    capacity.value = null
  }

  return {
    title,
    description,
    scheduledAt,
    location,
    capacity,
    reset
  }
})
