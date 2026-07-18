import '@fontsource-variable/inter/wght.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { DefaultApolloClient } from '@vue/apollo-composable'
import App from '../App.vue'
import router from '../router'
import { apolloClient } from '../apollo/client'
import { useUiStore } from '../stores/ui'
import './styles.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.provide(DefaultApolloClient, apolloClient)

// Synchronize resolved theme with document root before the first render.
const uiStore = useUiStore()
uiStore.initializeTheme()

app.mount('#app')
