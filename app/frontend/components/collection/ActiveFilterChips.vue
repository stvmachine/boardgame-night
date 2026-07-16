<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import Button from '@/components/ui/button/Button.vue'
import Icon from '@/components/ui/icon/Icon.vue'
import { useFilterStore } from '@/stores/filters'
import { useCollectorsStore } from '@/stores/collectors'
import { TIME_BUCKETS, COMPLEXITY_BUCKETS } from '@/composables/useCollectionFilters'

const filterStore = useFilterStore()
const collectorsStore = useCollectorsStore()

const { query, playerRange, selectedTimeBuckets, complexityBucket, selectedOwners, sort, groupBy, view } = storeToRefs(filterStore)

function formatPlayerRange(range: { min: number; max: number }): string {
  const maxLabel = range.max === 10 ? '10+' : String(range.max)
  return `${range.min}–${maxLabel} players`
}

const ownerChips = computed(() => {
  const all = collectorsStore.usernames
  const selected = Array.from(selectedOwners.value)
  if (selected.length === all.length || selected.length === 0) return []
  return selected.map(username => ({ username }))
})

const timeBucketChips = computed(() => {
  return Array.from(selectedTimeBuckets.value).map(value => {
    const bucket = TIME_BUCKETS.find(b => b.value === value)
    return { value, label: bucket?.label ?? String(value) }
  })
})

const complexityLabel = computed(() => {
  if (complexityBucket.value == null) return null
  const bucket = COMPLEXITY_BUCKETS.find(b => b.value === complexityBucket.value)
  return bucket?.label ?? String(complexityBucket.value)
})

const hasActiveFilters = computed(() => {
  return query.value.trim() !== '' ||
    playerRange.value != null ||
    selectedTimeBuckets.value.size > 0 ||
    complexityBucket.value != null ||
    ownerChips.value.length > 0
})

function removeSearch() {
  query.value = ''
}

function removePlayerRange() {
  playerRange.value = null
}

function removeTimeBucket(value: number) {
  const next = new Set(selectedTimeBuckets.value)
  next.delete(value)
  selectedTimeBuckets.value = next
}

function removeComplexity() {
  complexityBucket.value = null
}

function removeOwner(username: string) {
  filterStore.toggleOwner(username)
}

function clearAll() {
  filterStore.clearFilters()
}
</script>

<template>
  <div
    v-if="hasActiveFilters"
    data-slot="active-filter-chips"
    class="flex flex-wrap items-center gap-2"
  >
    <template v-if="query.trim()">
      <Button
        variant="secondary"
        size="sm"
        class="h-7 gap-1"
        data-testid="remove-search"
        @click="removeSearch"
      >
        Search: {{ query.trim() }}
        <Icon name="close" class="size-3" />
      </Button>
    </template>

    <template v-if="playerRange">
      <Button
        variant="secondary"
        size="sm"
        class="h-7 gap-1"
        data-testid="remove-player-range"
        @click="removePlayerRange"
      >
        Players: {{ formatPlayerRange(playerRange) }}
        <Icon name="close" class="size-3" />
      </Button>
    </template>

    <template v-for="bucket in timeBucketChips" :key="bucket.value">
      <Button
        variant="secondary"
        size="sm"
        class="h-7 gap-1"
        :data-testid="`remove-time-${bucket.value}`"
        @click="removeTimeBucket(bucket.value)"
      >
        Time: {{ bucket.label }}
        <Icon name="close" class="size-3" />
      </Button>
    </template>

    <template v-if="complexityLabel">
      <Button
        variant="secondary"
        size="sm"
        class="h-7 gap-1"
        data-testid="remove-complexity"
        @click="removeComplexity"
      >
        Complexity: {{ complexityLabel }}
        <Icon name="close" class="size-3" />
      </Button>
    </template>

    <template v-for="owner in ownerChips" :key="owner.username">
      <Button
        variant="secondary"
        size="sm"
        class="h-7 gap-1"
        :data-testid="`remove-owner-${owner.username}`"
        @click="removeOwner(owner.username)"
      >
        Owner: {{ owner.username }}
        <Icon name="close" class="size-3" />
      </Button>
    </template>

    <Button
      variant="ghost"
      size="sm"
      class="h-7 px-1 text-primary hover:text-primary/80"
      data-testid="clear-all-filters"
      @click="clearAll"
    >
      Clear all
    </Button>
  </div>
</template>
