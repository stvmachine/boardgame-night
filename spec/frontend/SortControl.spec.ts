import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SortControl from '@/components/collection/SortControl.vue'
import { SORT_OPTIONS } from '@/utils/sorting'

describe('SortControl', () => {
  it('renders all sort options', () => {
    const wrapper = mount(SortControl, {
      props: { modelValue: 'name_asc' }
    })
    const options = wrapper.findAll('option')
    expect(options.length).toBe(SORT_OPTIONS.length)
  })

  it('emits update:modelValue when selection changes', async () => {
    const wrapper = mount(SortControl, {
      props: { modelValue: 'name_asc' }
    })
    const select = wrapper.find('select')
    await select.setValue('rating_desc')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['rating_desc'])
  })
})
