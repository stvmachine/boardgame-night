<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import UsernameForm from './UsernameForm.vue'
</script>

<template>
  <Card>
    <CardContent class="p-6 space-y-4">
      <div class="space-y-2">
        <h1 class="text-[28px] font-semibold leading-tight text-on-surface">
          Merge board game collections
        </h1>
        <p class="text-base text-on-surface-variant">
          Enter one or more BoardGameGeek usernames to combine collections.
        </p>
      </div>
      <UsernameForm />
    </CardContent>
  </Card>
</template>
