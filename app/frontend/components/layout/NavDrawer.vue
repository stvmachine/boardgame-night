<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon/Icon.vue'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import NavSidebarContent from '@/components/layout/NavSidebarContent.vue'

const ui = useUiStore()
</script>

<template>
  <Sheet v-model:open="ui.sidebarOpen">
    <SheetTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        class="md:hidden"
        aria-label="Open navigation"
        @click="ui.openSidebar"
      >
        <Icon name="menu" class="h-6 w-6" />
      </Button>
    </SheetTrigger>
    <SheetContent side="left" close-aria-label="Close navigation" class="w-[min(320px,85vw)] sm:max-w-sm">
      <NavSidebarContent />
    </SheetContent>
  </Sheet>
</template>
