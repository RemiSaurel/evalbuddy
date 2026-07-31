<template>
  <div class="flex h-dvh flex-col">
    <Navbar />

    <div class="min-h-0 flex-1 overflow-y-auto">
      <div class="mx-auto max-w-6xl px-4 py-4">
        <slot />
      </div>
    </div>
  </div>
</template>
