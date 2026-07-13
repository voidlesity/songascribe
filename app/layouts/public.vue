<template>
  <div class="min-h-screen flex flex-col bg-base-200">
    <AppNav />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
