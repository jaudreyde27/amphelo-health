import { AppState, Workflow, ChatMessage, PatientProfile, Medication, Pharmacy } from './types'

const KEY = 'healthcare_app_state'

const defaultState: AppState = {
  profile: null,
  medications: [],
  pharmacies: [],
  workflows: [],
  messages: [],
  onboardingComplete: false,
}

export function getState(): AppState {
  if (typeof window === 'undefined') return defaultState
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState
  } catch {
    return defaultState
  }
}

export function setState(state: Partial<AppState>): void {
  if (typeof window === 'undefined') return
  const current = getState()
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...state }))
}

export function addWorkflow(workflow: Workflow): void {
  const state = getState()
  setState({ workflows: [workflow, ...state.workflows] })
}

export function updateWorkflow(id: string, updates: Partial<Workflow>): void {
  const state = getState()
  setState({
    workflows: state.workflows.map(w => w.id === id ? { ...w, ...updates } : w),
  })
}

export function addMessage(message: ChatMessage): void {
  const state = getState()
  setState({ messages: [...state.messages, message] })
}

export function clearState(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}

export function isOnboardingComplete(): boolean {
  return getState().onboardingComplete
}
