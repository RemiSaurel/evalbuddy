<template>
  <div class="flex h-dvh flex-col">
    <Navbar />

    <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <slot />
    </div>
  </div>
</template>
