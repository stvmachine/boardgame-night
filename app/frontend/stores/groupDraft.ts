import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useGroupDraftStore = defineStore('groupDraft', () => {
  const name = ref('')
  const description = ref('')

  function reset() {
    name.value = ''
    description.value = ''
  }

  return { name, description, reset }
})
