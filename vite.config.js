import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: './', // 相对路径：双击打开 dist/index.html 或部署到子路径均可用
  plugins: [vue()],
})
