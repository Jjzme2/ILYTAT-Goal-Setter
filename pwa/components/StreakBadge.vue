<template>
  <div class="flex items-center gap-2">
    <!-- Streak Counter -->
    <div 
      class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-bold transition-all"
      :class="streakClasses"
    >
      <span class="text-base">{{ streakIcon }}</span>
      <span>{{ stats.currentStreak }}</span>
    </div>

    <!-- Next Badge Progress (optional, shown on hover/click) -->
    <div 
      v-if="nextBadge && showProgress"
      class="text-xs text-gray-400 flex items-center gap-1"
    >
      <span>{{ nextBadge.icon }}</span>
      <span>{{ streakProgress }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStreaks } from '~/composables/useStreaks'

defineProps<{
  showProgress?: boolean
}>()

const { stats, nextBadge, streakProgress } = useStreaks()

const streakIcon = computed(() => {
  const streak = stats.value.currentStreak
  if (streak >= 100) return '👑'
  if (streak >= 60) return '💎'
  if (streak >= 30) return '🏆'
  if (streak >= 14) return '⚡'
  if (streak >= 7) return '🔥'
  if (streak >= 3) return '🌱'
  return '✨'
})

const streakClasses = computed(() => {
  const streak = stats.value.currentStreak
  if (streak >= 30) return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-500/30'
  if (streak >= 7) return 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-300 border border-orange-500/30'
  if (streak >= 3) return 'bg-green-500/20 text-green-300 border border-green-500/30'
  return 'bg-gray-700/50 text-gray-300 border border-gray-600/30'
})
</script>
