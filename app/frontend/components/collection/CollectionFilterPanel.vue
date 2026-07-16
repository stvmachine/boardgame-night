<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { useFilterStore } from '@/stores/filters'
import { useCollectorsStore } from '@/stores/collectors'
import PlayerRangeSlider from '@/components/collection/PlayerRangeSlider.vue'
import TimeBucketCheckboxes from '@/components/collection/TimeBucketCheckboxes.vue'
import ComplexityToggleGroup from '@/components/collection/ComplexityToggleGroup.vue'
import OwnerAvatarToggles from '@/components/collection/OwnerAvatarToggles.vue'

const filterStore = useFilterStore()
const collectorsStore = useCollectorsStore()
</script>

<template>
  <div class="space-y-6">
    <fieldset class="space-y-compact">
      <legend class="text-sm font-semibold text-on-surface">Search</legend>
      <Input
        id="filter-search"
        v-model="filterStore.query"
        aria-label="Search"
        placeholder="Search games..."
      />
    </fieldset>

    <fieldset class="space-y-compact border-t border-outline pt-6">
      <legend class="text-sm font-semibold text-on-surface">Owners</legend>
      <OwnerAvatarToggles
        v-model="filterStore.selectedOwners"
        :owners="collectorsStore.usernames"
      />
    </fieldset>

    <fieldset class="space-y-compact border-t border-outline pt-6">
      <legend class="text-sm font-semibold text-on-surface">Players</legend>
      <PlayerRangeSlider v-model="filterStore.playerRange" />
    </fieldset>

    <fieldset class="space-y-compact border-t border-outline pt-6">
      <legend class="text-sm font-semibold text-on-surface">Playing time</legend>
      <TimeBucketCheckboxes v-model="filterStore.selectedTimeBuckets" />
    </fieldset>

    <fieldset class="space-y-compact border-t border-outline pt-6">
      <legend class="text-sm font-semibold text-on-surface">Complexity</legend>
      <ComplexityToggleGroup v-model="filterStore.complexityBucket" />
    </fieldset>
  </div>
</template>
