<template>
  <div class="min-h-screen bg-[#0f0f1a] text-white font-inter">
    <div class="max-w-md mx-auto min-h-screen flex flex-col relative overflow-hidden">
      <!-- Header -->
      <header class="p-6 pb-2 z-10">
        <div class="flex justify-between items-center mb-1">
          <h1 class="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            ★ ILYTAT GOALS ★
          </h1>
          <button @click="showSettings = true" class="text-gray-400 hover:text-white p-2">
            <SettingsIcon class="w-5 h-5" />
          </button>
        </div>
        <p class="text-sm text-gray-400 font-medium">{{ formattedDate }}</p>
      </header>

      <!-- Overview Section -->
      <section class="px-6 py-4">
        <div class="grid grid-cols-2 gap-3">
          <div 
            v-for="tf in timeframes" 
            :key="tf.key"
            @click="selectTimeframe(tf.key)"
            class="bg-[#1a1a2e] p-3 rounded-xl border border-gray-800/50 hover:border-gray-700 transition-all cursor-pointer relative overflow-hidden group"
            :class="{'ring-2 ring-offset-2 ring-offset-[#0f0f1a] ring-opacity-50': currentTimeframe === tf.key}"
            :style="{ '--ring-color': tf.color }"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="text-2xl">{{ tf.icon }}</span>
              <span class="text-xs font-bold px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">
                {{ getProgressText(tf.key) }}
              </span>
            </div>
            <h3 class="font-semibold text-sm text-gray-200">{{ tf.label }}</h3>
            <div class="w-full bg-gray-800 h-1.5 mt-2 rounded-full overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-500"
                :style="{ width: `${getProgressPercent(tf.key)}%`, backgroundColor: tf.color }"
              ></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Connection Status -->
      <div v-if="!isConnected" class="mx-6 px-4 py-2 bg-red-900/20 border border-red-800/50 rounded-lg text-red-200 text-xs text-center mb-4">
        Offline Mode - Changes saved locally
      </div>

      <!-- Main Content Area -->
      <main class="flex-1 px-6 pb-24 overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold flex items-center gap-2">
            <span>{{ currentTimeframeConfig.icon }}</span>
            <span>{{ currentTimeframeConfig.label }} Goals</span>
          </h2>
          <button 
            @click="openAddModal"
            class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-transform"
          >
            <PlusIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Goals List -->
        <TransitionGroup name="list" tag="div" class="space-y-3">
          <div 
            v-for="(goal, idx) in currentGoals" 
            :key="goal.id"
            class="group bg-[#1a1a2e] p-4 rounded-xl border border-gray-800/50 flex items-start gap-3 transition-all hover:bg-[#20203a] touch-manipulation"
            :class="{ 'opacity-60': goal.completed }"
          >
            <button 
              @click="toggleGoal(idx)"
              class="mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0"
              :class="goal.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-600 text-transparent hover:border-gray-400'"
              :style="goal.completed ? {} : { borderColor: currentTimeframeConfig.color }"
            >
              <CheckIcon class="w-3.5 h-3.5" />
            </button>
            
            <div class="flex-1 min-w-0">
              <p 
                class="text-sm leading-relaxed transition-all decoration-2 decoration-gray-500"
                :class="{ 'line-through text-gray-500': goal.completed, 'text-gray-200': !goal.completed }"
              >
                {{ goal.text }}
              </p>
            </div>

            <button 
              @click="deleteGoal(idx)"
              class="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-opacity"
            >
              <Trash2Icon class="w-4 h-4" />
            </button>
          </div>
        </TransitionGroup>

        <div v-if="currentGoals.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-600">
          <TargetIcon class="w-12 h-12 mb-3 opacity-20" />
          <p class="text-sm">No goals set for this timeframe</p>
          <button @click="openAddModal" class="mt-4 text-blue-400 text-sm hover:underline">Create one now</button>
        </div>
      </main>

      <!-- Add Modal -->
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showModal = false"></div>
        <div class="relative bg-[#1a1a2e] w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl border-t border-gray-800 animate-slide-up">
          <h3 class="text-lg font-bold mb-4">Add New Goal</h3>
          <input 
            ref="goalInput"
            v-model="newGoalText"
            @keyup.enter="saveNewGoal"
            type="text" 
            class="w-full bg-[#0f0f1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all mb-4"
            placeholder="What do you want to achieve?"
          >
          <div class="flex gap-3">
            <button 
              @click="showModal = false"
              class="flex-1 px-4 py-2.5 rounded-lg border border-gray-700 text-gray-300 font-medium hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              @click="saveNewGoal"
              class="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!newGoalText.trim()"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <!-- Settings Modal -->
      <div v-if="showSettings" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showSettings = false"></div>
        <div class="relative bg-[#1a1a2e] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-gray-800 animate-slide-up">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold">Settings</h3>
            <button @click="showSettings = false" class="text-gray-400 hover:text-white">✕</button>
          </div>
          
          <div class="space-y-4">
            <div class="p-4 bg-[#0f0f1a] rounded-lg border border-gray-800">
              <h4 class="font-medium text-sm text-gray-300 mb-1">About ILYTAT Goals</h4>
              <p class="text-xs text-gray-500">Version 1.0.0 • Personal Goal Tracker</p>
            </div>
            
            <div class="p-4 bg-[#0f0f1a] rounded-lg border border-gray-800">
               <h4 class="font-medium text-sm text-gray-300 mb-1">Storage</h4>
               <p class="text-xs text-gray-500 flex items-center gap-2">
                 <span class="w-2 h-2 rounded-full" :class="isConnected ? 'bg-green-500' : 'bg-red-500'"></span>
                 {{ isConnected ? 'Connected to Firebase' : 'Offline Mode' }}
               </p>
            </div>
          </div>

          <button 
            @click="showSettings = false"
            class="w-full mt-6 px-4 py-2.5 rounded-lg bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDateFormat, useNow, useNetwork } from '@vueuse/core'
import { PlusIcon, CheckIcon, Trash2Icon, SettingsIcon, TargetIcon } from 'lucide-vue-next'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'

dayjs.extend(isoWeek)
dayjs.extend(quarterOfYear)

// --- STATE ---
const timeframes = [
  { key: 'daily', label: 'Daily', icon: '📅', color: '#00BCD4' },
  { key: 'weekly', label: 'Weekly', icon: '📆', color: '#E040FB' },
  { key: 'monthly', label: 'Monthly', icon: '🗓️', color: '#FFEB3B' },
  { key: 'quarterly', label: 'Quarterly', icon: '📊', color: '#FF9800' },
  { key: 'yearly', label: 'Yearly', icon: '🎯', color: '#4CAF50' }
]

const currentTimeframe = ref('daily')
const showModal = ref(false)
const showSettings = ref(false)
const newGoalText = ref('')
const goalInput = ref<any>(null)
const goalData = ref<Record<string, any>>({})
const { isOnline } = useNetwork()

// --- COMPUTED ---
const formattedDate = useDateFormat(useNow(), 'dddd, MMMM D, YYYY')
const isConnected = computed(() => isOnline.value)

const currentTimeframeConfig = computed(() => timeframes.find(t => t.key === currentTimeframe.value)!)

const currentGoals = computed(() => {
    const key = currentTimeframe.value
    return goalData.value[key]?.goals || []
})

// --- API ---
async function fetchAllData() {
    try {
        const data = await $fetch('/api/goals')
        goalData.value = data as Record<string, any>
    } catch (e) {
        console.error('Error fetching data', e)
    }
}

async function saveLog(timeframe: string) {
    const data = goalData.value[timeframe]
    if (!data) return

    try {
        await $fetch('/api/goals', {
            method: 'POST',
            body: { timeframe, data }
        })
    } catch (e) {
        console.error('Error saving', e)
    }
}

// --- METHODS ---
function selectTimeframe(key: string) {
    currentTimeframe.value = key
}

function getProgressPercent(key: string) {
    const goals = goalData.value[key]?.goals || []
    if (goals.length === 0) return 0
    const completed = goals.filter((g: any) => g.completed).length
    return Math.round((completed / goals.length) * 100)
}

function getProgressText(key: string) {
    const goals = goalData.value[key]?.goals || []
    const completed = goals.filter((g: any) => g.completed).length
    return goals.length > 0 ? `${completed}/${goals.length}` : '0/0'
}

function openAddModal() {
    showModal.value = true
    setTimeout(() => goalInput.value?.focus(), 100)
}

function toggleGoal(idx: number) {
    const key = currentTimeframe.value
    if (!goalData.value[key]) return
    goalData.value[key].goals[idx].completed = !goalData.value[key].goals[idx].completed
    saveLog(key)
}

function deleteGoal(idx: number) {
    const key = currentTimeframe.value
    if (!goalData.value[key]) return
    if (window.confirm('Delete this goal?')) {
        goalData.value[key].goals.splice(idx, 1)
        saveLog(key)
    }
}

async function saveNewGoal() {
    if (!newGoalText.value.trim()) return
    
    const key = currentTimeframe.value
    if (!goalData.value[key]) goalData.value[key] = { goals: [] }
    
    const goals = goalData.value[key].goals
    const newId = goals.length > 0
        ? String(Math.max(...goals.map((g: any) => parseInt(g.id) || 0)) + 1)
        : '1'
        
    goals.push({
        id: newId,
        text: newGoalText.value.trim(),
        completed: false
    })
    
    await saveLog(key)
    newGoalText.value = ''
    showModal.value = false
}

onMounted(() => {
    fetchAllData()
})
</script>

<style>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
