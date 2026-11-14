import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
    pool: 'forks',
    // The subprocess specs spawn real child processes and share the OS temp
    // directory; keep spec files serial so cleanup assertions stay reliable.
    fileParallelism: false,
  },
})
