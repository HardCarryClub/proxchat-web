/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import '../css/app.css'
import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { TransmitContext } from '~/providers/transmit'
import { Transmit } from '@adonisjs/transmit-client'

const appName = import.meta.env.VITE_APP_NAME || 'Prox Chat'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  resolve: (name) => {
    return resolvePageComponent(`../pages/${name}.tsx`, import.meta.glob('../pages/**/*.tsx'))
  },

  setup({ el, App, props }) {
    const transmit = new Transmit({
      baseUrl: window.location.origin,
    })

    createRoot(el).render(
      <>
        <div className="container mx-auto">
          <TransmitContext.Provider value={transmit}>
            <App {...props} />
          </TransmitContext.Provider>
        </div>
      </>
    )
  },
})
