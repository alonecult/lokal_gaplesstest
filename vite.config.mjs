import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// React Compiler (automatic memoization), for these files only. They render
// on every player tick (progress, volume, likes): memoized, a re-render of the
// right sidebar no longer re-renders every queue row under it, which with a
// 4,600-song queue was ~100 ms of work per tick.
//
// Opt-in, file by file: the compiler reads property paths it depends on
// (`user.id`) during render, even when the code only reads them in a handler
// behind a null check, so a component that renders with that object null
// would crash. A file goes on this list once its compiled output has been
// checked for that (scripts/react-compiler.test.mjs).
export const COMPILED = [
  'QueuePanel', 'RightSidebar', 'FullscreenPlayer', 'LyricsPanel', 'LyricsSidePanel', 'LyricsFullscreen',
  'Sidebar', 'ArtworkBackdrop', 'ContextMenu', 'Modal',
]

// Vite hands plugins forward-slash ids, on Windows too, sometimes with a
// query (`?v=`), so compare a normalised path rather than one built with path.sep.
export const isCompiled = (filename) => {
  const file = String(filename).split('?')[0].replace(/\\/g, '/')
  return COMPILED.some(name => file.endsWith(`/src/components/${name}.jsx`))
}

const compilerPreset = reactCompilerPreset()
const compilerFilter = new RegExp(
  `[\\\\/]src[\\\\/]components[\\\\/](?:${COMPILED.join('|')})\\.jsx(?:\\?.*)?$`
)
compilerPreset.rolldown.filter.id = compilerFilter

export default defineConfig({
  plugins: [react(), babel({ include: compilerFilter, presets: [compilerPreset] })],
  resolve: { alias: { '@': path.resolve(dirname, 'src') } },
  base: '/',
  build: { 
    outDir: 'dist',
    rollupOptions: {
      external: ['better-sqlite3']
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true
  }
})
