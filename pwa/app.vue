<template>
  <div class="min-h-screen text-white font-inter" :style="{ backgroundColor: currentTheme.colors.background }">
    <div class="max-w-md mx-auto min-h-screen flex flex-col relative overflow-hidden">
      <!-- Header -->
      <header class="p-6 pb-2 z-10">
        <div class="flex justify-between items-center mb-1">
          <h1 
            class="text-xl font-bold bg-clip-text text-transparent"
            :style="{ backgroundImage: `linear-gradient(to right, ${currentTheme.colors.gradientFrom}, ${currentTheme.colors.gradientTo})` }"
          >
            ★ ILYTAT GOALS ★
          </h1>
          <div class="flex items-center gap-2">
            <!-- Logged in: Show streak + profile -->
            <template v-if="isLoggedIn">
              <StreakBadge />
              
              <button 
                @click="showUserMenu = !showUserMenu"
                class="relative flex items-center gap-2 p-1 rounded-full hover:bg-gray-800/50 transition-colors"
              >
                <div 
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  :style="{ background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})` }"
                >
                  {{ displayName.charAt(0).toUpperCase() }}
                </div>
              </button>
              
              <!-- User Menu Dropdown -->
              <div 
                v-if="showUserMenu" 
                class="absolute right-4 top-16 border rounded-xl shadow-xl p-2 min-w-[200px] z-50"
                :style="{ backgroundColor: currentTheme.colors.surface, borderColor: 'rgba(255,255,255,0.1)' }"
              >
                <div class="px-3 py-2 border-b border-gray-700/50 mb-2">
                  <p class="font-medium text-sm">{{ displayName }}</p>
                  <p class="text-xs text-gray-400">{{ email }}</p>
                </div>
                <button 
                  @click="handleLogout"
                  class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-800/50 rounded-lg transition-colors"
                >
                  <LogOutIcon class="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </template>
            
            <div v-else-if="authLoading" class="w-8 h-8 rounded-full bg-gray-800 animate-pulse"></div>
            
            <button @click="showSettings = true" class="text-gray-400 hover:text-white p-2">
              <SettingsIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      <div class="flex items-center justify-between mb-2 px-1">
        <button @click="navigateDate(-1)" class="p-1 hover:bg-gray-800/50 rounded-full text-gray-400 hover:text-white transition-colors">
          <ChevronLeftIcon class="w-5 h-5" />
        </button>
        <p class="text-sm text-gray-400 font-medium select-none cursor-pointer hover:text-white transition-colors" @click="resetDate">
          {{ formattedDate }}
        </p>
        <button @click="navigateDate(1)" class="p-1 hover:bg-gray-800/50 rounded-full text-gray-400 hover:text-white transition-colors">
          <ChevronRightIcon class="w-5 h-5" />
        </button>
      </div>
      </header>

      <!-- Login Form -->
      <div v-if="!isLoggedIn && !authLoading" class="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div 
          class="w-20 h-20 mb-6 rounded-full flex items-center justify-center"
          :style="{ background: `linear-gradient(135deg, ${currentTheme.colors.primary}33, ${currentTheme.colors.secondary}33)` }"
        >
          <TargetIcon class="w-10 h-10" :style="{ color: currentTheme.colors.primary }" />
        </div>
        <h2 class="text-xl font-bold mb-2">Welcome to ILYTAT Goals</h2>
        <p class="text-gray-400 mb-6 max-w-xs">Track your daily, weekly, monthly, quarterly, and yearly goals.</p>
        
        <!-- Email/Password Form -->
        <form @submit.prevent="handleLogin" class="w-full max-w-xs space-y-3">
          <input 
            v-model="loginEmail"
            type="email"
            placeholder="Email"
            required
            class="w-full px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 transition-all"
            :style="{ backgroundColor: currentTheme.colors.surface, '--tw-ring-color': currentTheme.colors.primary }"
          />
          <input 
            v-model="loginPassword"
            type="password"
            placeholder="Password"
            required
            class="w-full px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 transition-all"
            :style="{ backgroundColor: currentTheme.colors.surface, '--tw-ring-color': currentTheme.colors.primary }"
          />
          
          <!-- Error Message -->
          <p v-if="authError" class="text-red-400 text-sm">{{ authError }}</p>
          
          <button 
            type="submit"
            :disabled="loginLoading"
            class="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-medium shadow-lg transition-all active:scale-95 disabled:opacity-60"
            :style="{ background: `linear-gradient(to right, ${currentTheme.colors.gradientFrom}, ${currentTheme.colors.gradientTo})` }"
          >
            <div v-if="loginLoading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <template v-else>
              <LogInIcon class="w-5 h-5" />
              Sign In
            </template>
          </button>
        </form>
      </div>

      <!-- Loading State -->
      <div v-else-if="authLoading" class="flex-1 flex items-center justify-center">
        <div 
          class="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          :style="{ borderColor: currentTheme.colors.primary, borderTopColor: 'transparent' }"
        ></div>
      </div>

      <!-- Main App Content (when logged in) -->
      <template v-else>
        <!-- Overview Section -->
        <section class="px-6 py-4">
          <div class="grid grid-cols-2 gap-3">
            <div 
              v-for="tf in timeframes" 
              :key="tf.key"
              @click="selectTimeframe(tf.key)"
              class="p-3 rounded-xl border border-gray-800/50 hover:border-gray-700 transition-all cursor-pointer relative overflow-hidden group"
              :class="{'ring-2 ring-offset-2 ring-opacity-50': currentTimeframe === tf.key}"
              :style="{ 
                backgroundColor: currentTheme.colors.surface,
                '--ring-color': tf.color,
                '--ring-offset-color': currentTheme.colors.background
              }"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="text-2xl">{{ tf.icon }}</span>
                <span class="text-xs font-bold px-1.5 py-0.5 rounded bg-gray-800/50 text-gray-300">
                  {{ getProgressText(tf.key) }}
                </span>
              </div>
              <h3 class="font-semibold text-sm text-gray-200">{{ tf.label }}</h3>
              <div class="w-full bg-gray-800/50 h-1.5 mt-2 rounded-full overflow-hidden">
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
              class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg active:scale-95 transition-transform"
              :style="{ background: `linear-gradient(to right, ${currentTheme.colors.gradientFrom}, ${currentTheme.colors.gradientTo})` }"
            >
              <PlusIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Goals List -->
          <TransitionGroup name="list" tag="div" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div 
                v-for="(goal, idx) in currentGoals" 
                :key="goal.id"
                class="group p-4 rounded-xl border border-gray-800/50 flex flex-col gap-3 transition-all hover:opacity-90 touch-manipulation h-full"
                :class="{ 'opacity-60': goal.completed }"
                :style="{ backgroundColor: currentTheme.colors.surface }"
              >
                <div class="flex items-start justify-between w-full">
                  <button 
                    @click="toggleGoal(idx)"
                    class="mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0"
                    :class="goal.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-600 text-transparent hover:border-gray-400'"
                    :style="goal.completed ? {} : { borderColor: currentTimeframeConfig.color }"
                  >
                    <CheckIcon class="w-3.5 h-3.5" />
                  </button>
                  
                  <button 
                    @click="deleteGoal(idx)"
                    class="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-opacity"
                  >
                    <Trash2Icon class="w-4 h-4" />
                  </button>
                </div>
                
                <div class="flex-1 min-w-0">
                    <p 
                      class="text-sm leading-relaxed transition-all decoration-2 decoration-gray-500 line-clamp-2"
                      :class="{ 'line-through text-gray-500': goal.completed, 'text-gray-200': !goal.completed }"
                    >
                      {{ goal.text }}
                    </p>
                    <div class="flex flex-wrap items-center gap-2 mt-2">
                        <span 
                          v-if="goal.priority && goal.priority !== 'medium'"
                          class="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider"
                          :class="goal.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'"
                        >
                          {{ goal.priority }}
                        </span>
                        <span 
                          v-if="goal.category"
                          class="text-[10px] px-1.5 py-0.5 rounded border border-gray-700 text-gray-400"
                        >
                          {{ goal.category }}
                        </span>
                    </div>
                     <p v-if="goal.description" class="text-xs text-gray-500 line-clamp-2 mt-1">{{ goal.description }}</p>
                  </div>
              </div>
            </TransitionGroup>

          <div v-if="currentGoals.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-600">
            <TargetIcon class="w-12 h-12 mb-3 opacity-20" />
            <p class="text-sm">No goals set for this timeframe</p>
            <button @click="openAddModal" class="mt-4 text-sm hover:underline" :style="{ color: currentTheme.colors.primary }">Create one now</button>
          </div>
        </main>
      </template>

      <!-- Add Modal -->
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showModal = false"></div>
        <div 
          class="relative w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl border-t border-gray-800 animate-slide-up"
          :style="{ backgroundColor: currentTheme.colors.surface }"
        >
          <h3 class="text-lg font-bold mb-4">Add New Goal</h3>
          <input 
            ref="goalInput"
            v-model="newGoalText"
            @keyup.enter="saveNewGoal"
            type="text" 
            class="w-full border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 transition-all mb-4"
            :style="{ backgroundColor: currentTheme.colors.background, '--tw-ring-color': currentTheme.colors.primary }"
            placeholder="What do you want to achieve?"
          >

          <textarea
            v-model="newGoalDescription"
            rows="2"
            class="w-full border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 transition-all mb-4 text-sm"
            :style="{ backgroundColor: currentTheme.colors.background, '--tw-ring-color': currentTheme.colors.primary }"
            placeholder="Description (optional)"
          ></textarea>

          <div class="mb-4">
            <label class="text-xs text-gray-500 font-medium mb-2 block">Category</label>
            <input 
              v-model="newGoalCategory"
              type="text" 
              class="w-full border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 transition-all mb-2 text-sm"
              :style="{ backgroundColor: currentTheme.colors.background, '--tw-ring-color': currentTheme.colors.primary }"
              placeholder="e.g. Work, Family, Health..."
            >
            <div class="flex flex-wrap gap-2">
                <button 
                    v-for="cat in categories"
                    :key="cat"
                    @click="newGoalCategory = cat"
                    class="px-2 py-1 rounded text-[10px] font-medium border border-gray-700 hover:bg-gray-800 transition-colors"
                    :class="newGoalCategory === cat ? 'bg-white/10 text-white border-white' : 'text-gray-400'"
                >
                    {{ cat }}
                </button>
            </div>
          </div>

          <div class="mb-4">
            <label class="text-xs text-gray-500 font-medium mb-2 block">Priority</label>
            <div class="flex gap-2">
                <button 
                    v-for="p in ['low', 'medium', 'high']" 
                    :key="p"
                    @click="newGoalPriority = p"
                    class="flex-1 py-2 rounded-lg text-xs font-medium capitalize border transition-all"
                    :class="newGoalPriority === p ? 'border-transparent text-white' : 'border-gray-700 text-gray-400 hover:border-gray-600'"
                    :style="newGoalPriority === p ? { backgroundColor: p === 'high' ? '#EF4444' : p === 'medium' ? '#F59E0B' : '#10B981' } : {}"
                >
                    {{ p }}
                </button>
            </div>
          </div>
          <div class="flex gap-3">
            <button 
              @click="showModal = false"
              class="flex-1 px-4 py-2.5 rounded-lg border border-gray-700 text-gray-300 font-medium hover:bg-gray-800/50 transition-colors"
            >
              Cancel
            </button>
            <button 
              @click="saveNewGoal"
              class="flex-1 px-4 py-2.5 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :style="{ backgroundColor: currentTheme.colors.primary }"
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
        <div 
          class="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-gray-800 animate-slide-up max-h-[80vh] overflow-y-auto"
          :style="{ backgroundColor: currentTheme.colors.surface }"
        >
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold">Settings</h3>
            <button @click="showSettings = false" class="text-gray-400 hover:text-white">✕</button>
          </div>
          
          <div class="space-y-4">
            <!-- User Info -->
            <div v-if="isLoggedIn" class="p-4 rounded-lg border border-gray-800" :style="{ backgroundColor: currentTheme.colors.background }">
              <h4 class="font-medium text-sm text-gray-300 mb-1">Signed in as</h4>
              <p class="text-xs text-gray-500">{{ email }}</p>
            </div>
            
            <!-- Theme Picker -->
            <div class="p-4 rounded-lg border border-gray-800" :style="{ backgroundColor: currentTheme.colors.background }">
              <h4 class="font-medium text-sm text-gray-300 mb-3">Theme</h4>
              <div class="grid grid-cols-5 gap-2">
                <button
                  v-for="theme in themes"
                  :key="theme.id"
                  @click="setTheme(theme.id)"
                  class="aspect-square rounded-lg flex items-center justify-center text-lg transition-all border-2"
                  :class="currentTheme.id === theme.id ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'"
                  :style="{ backgroundColor: theme.colors.surface }"
                  :title="theme.name"
                >
                  {{ theme.icon }}
                </button>
              </div>
              <p class="text-xs text-gray-500 mt-2">{{ currentTheme.name }}</p>
            </div>
            
            <!-- Stats -->
            <div v-if="isLoggedIn" class="p-4 rounded-lg border border-gray-800" :style="{ backgroundColor: currentTheme.colors.background }">
              <h4 class="font-medium text-sm text-gray-300 mb-3">Your Stats</h4>
              <div class="grid grid-cols-2 gap-3 text-center">
                <div class="p-2 rounded-lg bg-gray-800/30">
                  <p class="text-2xl font-bold" :style="{ color: currentTheme.colors.primary }">{{ stats.currentStreak }}</p>
                  <p class="text-xs text-gray-500">Day Streak</p>
                </div>
                <div class="p-2 rounded-lg bg-gray-800/30">
                  <p class="text-2xl font-bold" :style="{ color: currentTheme.colors.secondary }">{{ stats.longestStreak }}</p>
                  <p class="text-xs text-gray-500">Best Streak</p>
                </div>
                <div class="p-2 rounded-lg bg-gray-800/30 col-span-2">
                  <p class="text-2xl font-bold text-green-400">{{ stats.totalGoalsCompleted }}</p>
                  <p class="text-xs text-gray-500">Total Goals Completed</p>
                </div>
              </div>
            </div>
            
            <!-- Badges -->
            <div v-if="isLoggedIn && stats.badges.length > 0" class="p-4 rounded-lg border border-gray-800" :style="{ backgroundColor: currentTheme.colors.background }">
              <h4 class="font-medium text-sm text-gray-300 mb-3">Badges Earned</h4>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="badgeId in stats.badges" 
                  :key="badgeId"
                  class="text-2xl"
                  :title="badgeId"
                >
                  {{ getBadgeIcon(badgeId) }}
                </span>
              </div>
            </div>
            
            <!-- About -->
            <div class="p-4 rounded-lg border border-gray-800" :style="{ backgroundColor: currentTheme.colors.background }">
              <h4 class="font-medium text-sm text-gray-300 mb-1">About ILYTAT Goals</h4>
              <p class="text-xs text-gray-500">Version 1.2.0 • Multi-User Goal Tracker</p>
            </div>
            
            <!-- Quick Categories -->
            <div class="p-4 rounded-lg border border-gray-800" :style="{ backgroundColor: currentTheme.colors.background }">
               <h4 class="font-medium text-sm text-gray-300 mb-3">Quick Categories</h4>
               <div class="flex flex-wrap gap-2 mb-3">
                 <div 
                   v-for="cat in categories" 
                   :key="cat"
                   class="flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs text-gray-300"
                 >
                   {{ cat }}
                   <button @click="removeCategory(cat)" class="hover:text-red-400 flex items-center justify-center p-0.5">
                     <span class="sr-only">Remove</span>
                     <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                   </button>
                 </div>
               </div>
               
               <div class="flex gap-2">
                 <input 
                   v-model="newCategoryInput"
                   type="text" 
                   @keyup.enter="handleAddCategory"
                   class="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gray-500"
                   placeholder="New category..."
                 />
                 <button 
                   @click="handleAddCategory"
                   class="px-3 py-1.5 rounded text-xs font-medium text-white transition-opacity hover:opacity-90"
                   :style="{ backgroundColor: currentTheme.colors.primary }"
                   :disabled="!newCategoryInput.trim()"
                 >
                   Add
                 </button>
               </div>
            </div>

             <!-- Connection -->
             <div class="p-4 rounded-lg border border-gray-800" :style="{ backgroundColor: currentTheme.colors.background }">
                <h4 class="font-medium text-sm text-gray-300 mb-1">Connection</h4>
                <p class="text-xs text-gray-500 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full" :class="isConnected ? 'bg-green-500' : 'bg-red-500'"></span>
                  {{ isConnected ? 'Connected to Firebase' : 'Offline Mode' }}
                </p>
             </div>
           </div>

          <button 
            @click="showSettings = false"
            class="w-full mt-6 px-4 py-2.5 rounded-lg text-white font-medium hover:opacity-90 transition-colors"
            :style="{ backgroundColor: currentTheme.colors.primary }"
          >
            Close
          </button>
        </div>
      </div>
    </div>
    
    <!-- Click outside to close user menu -->
    <div v-if="showUserMenu" class="fixed inset-0 z-40" @click="showUserMenu = false"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDateFormat, useNow, useNetwork } from '@vueuse/core'
import { PlusIcon, CheckIcon, Trash2Icon, SettingsIcon, TargetIcon, LogInIcon, LogOutIcon, ChevronLeftIcon, ChevronRightIcon, AlertCircleIcon, FileTextIcon, MoreHorizontalIcon } from 'lucide-vue-next'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import { useAuth } from '~/composables/useAuth'
import { useStreaks } from '~/composables/useStreaks'
import { useTheme } from '~/composables/useTheme'
import { useSettings } from '~/composables/useSettings'
import StreakBadge from '~/components/StreakBadge.vue'

dayjs.extend(isoWeek)
dayjs.extend(quarterOfYear)

// --- AUTH ---
const { user, loading: authLoading, authError, isLoggedIn, displayName, photoURL, email, login, logout, getIdToken, initAuth, clearError } = useAuth()
const { stats, fetchStats, recordDailyCompletion, BADGES } = useStreaks()
const { themes, currentTheme, setTheme, initTheme } = useTheme()
const { categories, fetchSettings, addCategory, removeCategory } = useSettings()
const showUserMenu = ref(false)

// Login form
const loginEmail = ref('')
const loginPassword = ref('')
const loginLoading = ref(false)

async function handleLogin() {
  if (!loginEmail.value || !loginPassword.value) return
  
  loginLoading.value = true
  clearError()
  
  try {
    await login(loginEmail.value, loginPassword.value)
    showUserMenu.value = false
    loginEmail.value = ''
    loginPassword.value = ''
    await fetchAllData()
    await fetchStats()
  } catch (error) {
    console.error('Login failed:', error)
  } finally {
    loginLoading.value = false
  }
}

async function handleLogout() {
  try {
    await logout()
    showUserMenu.value = false
    goalData.value = {}
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

function getBadgeIcon(badgeId: string): string {
  const badge = BADGES.find(b => b.id === badgeId)
  return badge?.icon || '🏅'
}

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

// New Goal State
const newGoalText = ref('')
const newGoalDescription = ref('')
const newGoalPriority = ref('medium')
const newGoalCategory = ref('')
const newGoalNotes = ref('')
const newCategoryInput = ref('')
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))

const goalInput = ref<HTMLInputElement | null>(null)
const goalData = ref<Record<string, any>>({})
const { isOnline } = useNetwork()

// --- COMPUTED ---
// --- COMPUTED ---
const formattedDate = computed(() => {
    const d = dayjs(selectedDate.value)
    switch (currentTimeframe.value) {
        case 'weekly':
            const start = d.startOf('isoWeek')
            const end = d.endOf('isoWeek')
            return `Week ${d.isoWeek()}, ${d.year()} (${start.format('MMM D')} - ${end.format('MMM D')})`
        case 'monthly':
            return d.format('MMMM YYYY')
        case 'quarterly':
            const qStart = d.startOf('quarter')
            const qEnd = d.endOf('quarter')
            return `Q${d.quarter()} ${d.year()} (${qStart.format('MMM D')} - ${qEnd.format('MMM D')})`
        case 'yearly':
            return d.format('YYYY')
        default:
            return d.format('dddd, MMMM D, YYYY')
    }
})

const isConnected = computed(() => isOnline.value)
const currentTimeframeConfig = computed(() => timeframes.find(t => t.key === currentTimeframe.value)!)

const currentGoals = computed((): any[] => {
    const key = currentTimeframe.value
    return goalData.value[key]?.goals || []
})

// --- API ---
async function fetchAllData() {
    if (!isLoggedIn.value) return
    
    try {
        console.time('fetchAllData')
        const token = await getIdToken()
        const data = await $fetch('/api/goals', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            query: {
                date: selectedDate.value
            }
        })
        goalData.value = data as Record<string, any>
        console.timeEnd('fetchAllData')
    } catch (e) {
        console.timeEnd('fetchAllData')
        console.error('Error fetching data', e)
    }
}

async function saveLog(timeframe: string) {
    if (!isLoggedIn.value) return
    
    const data = goalData.value[timeframe]
    if (!data) return

    try {
        const token = await getIdToken()
        await $fetch('/api/goals', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: { 
                timeframe, 
                data,
                date: selectedDate.value
            }
        })
    } catch (e) {
        console.error('Error saving', e)
    }
}

async function handleAddCategory() {
    if (!newCategoryInput.value.trim()) return
    await addCategory(newCategoryInput.value)
    newCategoryInput.value = ''
}

// --- METHODS ---
function navigateDate(direction: number) {
    let unit: any = 'day'
    
    switch (currentTimeframe.value) {
        case 'weekly': unit = 'week'; break;
        case 'monthly': unit = 'month'; break;
        case 'quarterly': unit = 'quarter'; break;
        case 'yearly': unit = 'year'; break;
    }

    selectedDate.value = dayjs(selectedDate.value).add(direction, unit).format('YYYY-MM-DD')
    fetchAllData()
}

function resetDate() {
    selectedDate.value = dayjs().format('YYYY-MM-DD')
    fetchAllData()
}

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
    newGoalText.value = ''
    newGoalDescription.value = ''
    newGoalDescription.value = ''
    newGoalPriority.value = 'medium'
    newGoalCategory.value = ''
    newGoalNotes.value = ''
    setTimeout(() => goalInput.value?.focus(), 100)
}

function toggleGoal(idx: number) {
    const key = currentTimeframe.value
    if (!goalData.value[key]) return
    goalData.value[key].goals[idx].completed = !goalData.value[key].goals[idx].completed
    saveLog(key)
    
    // Track daily completion for streaks
    if (key === 'daily') {
        const goals = goalData.value[key].goals
        const allCompleted = goals.length > 0 && goals.every((g: any) => g.completed)
        // Record completion for the SELECTED date, not necessarily today
        recordDailyCompletion(selectedDate.value, allCompleted)
    }
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
        description: newGoalDescription.value.trim(),
        priority: newGoalPriority.value,
        category: newGoalCategory.value.trim(),
        notes: newGoalNotes.value.trim(),
        status: 'todo',
        completed: false
    })
    
    await saveLog(key)
    showModal.value = false
}

// Watch for auth changes to fetch data
watch(isLoggedIn, (loggedIn) => {
    if (loggedIn) {
        fetchAllData()
        fetchStats()
        fetchSettings()
    }
})

onMounted(() => {
    initAuth()
    initTheme()
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
