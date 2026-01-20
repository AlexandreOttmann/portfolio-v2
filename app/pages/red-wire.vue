<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <section class="relative overflow-hidden border-b border-border">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      <DotPattern class="absolute inset-0 opacity-20" />

      <!-- Animated gradient orbs -->
      <div class="absolute top-20 left-10 size-64 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
      <div
        class="absolute bottom-20 right-10 size-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
        style="animation-delay: 1s;"
      />

      <div class="relative container mx-auto px-4 py-16 md:py-24">
        <Motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.6 }"
        >
          <div class="max-w-4xl mx-auto text-center space-y-6">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium animate-pulse">
              <UIcon
                name="i-ph-code-duotone"
                class="size-4"
              />
              {{ t('redwire.cv_showcase') }}
            </div>

            <h1 class="text-4xl md:text-6xl font-bold bg-gradient-to-br from-foreground via-primary to-foreground/60 bg-clip-text text-transparent animate-gradient">
              {{ t('redwire.title') }}
            </h1>

            <p class="text-xl md:text-2xl text-muted-foreground">
              {{ t('redwire.subtitle') }}
            </p>

            <p class="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {{ t('redwire.tagline') }}
            </p>

            <!-- GitHub CTA -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <UButton
                to="https://github.com/AlexandreOttmann/realtime-ai-ops-platform"
                target="_blank"
                size="lg"
                color="primary"
                variant="solid"
                icon="i-ph-github-logo"
                trailing
                class="group"
              >
                {{ t('redwire.view_on_github') }}
                <UIcon
                  name="i-ph-arrow-up-right"
                  class="ml-1 size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                />
              </UButton>
              <UButton
                to="https://github.com/AlexandreOttmann/realtime-ai-ops-platform"
                target="_blank"
                size="lg"
                color="neutral"
                variant="outline"
                icon="i-ph-star-duotone"
              >
                {{ t('redwire.star_on_github') }}
              </UButton>
            </div>
          </div>
        </Motion>
      </div>
    </section>
    <!-- Current Project -->
    <section class="relative border-b border-border bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-red-500/5 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />

      <div class="container mx-auto px-4 py-12">
        <Motion
          :initial="{ opacity: 0, scale: 0.95 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ duration: 0.6, delay: 0.2 }"
        >
          <div class="max-w-3xl mx-auto">
            <UCard class="relative overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
              <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full animate-pulse" />
              <div
                class="absolute -top-10 -right-10 size-20 bg-primary/30 rounded-full blur-2xl animate-ping"
                style="animation-duration: 3s;"
              />
              <div class="relative space-y-3">
                <div class="flex items-center gap-3">
                  <div class="relative">
                    <UIcon
                      name="i-ph-rocket-launch-duotone"
                      class="size-6 text-primary animate-bounce"
                      style="animation-duration: 2s;"
                    />
                    <div class="absolute inset-0 size-6 bg-primary/20 rounded-full blur-md animate-pulse" />
                  </div>
                  <h2 class="text-2xl font-bold">
                    {{ t('redwire.current_project') }}
                  </h2>
                </div>
                <p class="text-muted-foreground">
                  {{ t('redwire.current_project_desc') }}
                </p>
              </div>
            </UCard>
          </div>
        </Motion>
      </div>
    </section>

    <!-- Architectural Principles -->
    <section class="relative border-b border-border overflow-hidden">
      <div class="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div class="container mx-auto px-4 py-16 relative">
        <Motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.6 }"
        >
          <div class="text-center space-y-4 mb-12">
            <h2 class="text-3xl md:text-4xl font-bold">
              {{ t('redwire.principles_title') }}
            </h2>
          </div>
        </Motion>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
          <Motion
            v-for="(principle, index) in principles"
            :key="index"
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6, delay: index * 0.1 }"
          >
            <UCard class="h-full group relative overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
              <div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div class="space-y-3 relative">
                <div class="flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <UIcon
                    :name="principle.icon"
                    class="size-6"
                  />
                </div>
                <h3 class="font-semibold text-lg group-hover:text-primary transition-colors duration-300">
                  {{ principle.title }}
                </h3>
                <p class="text-sm text-muted-foreground">
                  {{ principle.description }}
                </p>
              </div>
            </UCard>
          </Motion>
        </div>
      </div>
    </section>

    <!-- Tech Stack Section -->
    <section class="relative border-b border-border overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

      <div class="container mx-auto px-4 py-16 relative">
        <Motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.6 }"
        >
          <div class="text-center space-y-4 mb-12">
            <h2 class="text-3xl md:text-4xl font-bold">
              {{ t('redwire.tech_stack_title') }}
            </h2>
            <p class="text-muted-foreground max-w-3xl mx-auto">
              {{ t('redwire.tech_stack_subtitle') }}
            </p>
          </div>
        </Motion>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          <Motion
            v-for="(tech, index) in techStack"
            :key="index"
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6, delay: index * 0.08 }"
          >
            <UCard class="h-full group relative overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
              <!-- Gradient background on hover -->
              <div
                class="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br"
                :class="tech.color"
              />

              <div class="space-y-4 relative">
                <div class="flex items-start gap-4">
                  <div
                    class="flex items-center justify-center size-12 rounded-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 bg-gradient-to-br"
                    :class="tech.color"
                  >
                    <UIcon
                      :name="tech.icon"
                      class="size-6 text-white"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-lg group-hover:text-primary transition-colors duration-300">
                      {{ tech.title }}
                    </h3>
                  </div>
                </div>
                <p class="text-sm text-muted-foreground leading-relaxed">
                  {{ tech.description }}
                </p>
              </div>
            </UCard>
          </Motion>
        </div>
      </div>
    </section>

    <!-- Current Project Notice -->

    <!-- Roadmap Timeline -->
    <section
      ref="timelineRef"
      class="relative border-b border-border overflow-hidden"
    >
      <!-- Animated background -->
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div class="container mx-auto px-4 py-16 relative">
        <Motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.6 }"
        >
          <div class="text-center space-y-4 mb-16">
            <h2 class="text-3xl md:text-4xl font-bold">
              {{ t('redwire.roadmap_title') }}
            </h2>
            <p class="text-muted-foreground max-w-2xl mx-auto">
              {{ t('redwire.roadmap_desc') }}
            </p>
          </div>
        </Motion>

        <!-- Desktop Timeline -->
        <div class="hidden lg:block max-w-6xl mx-auto">
          <div class="relative">
            <!-- Central Line -->
            <div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />

            <!-- Progress Line with Glow -->
            <div
              class="absolute left-1/2 top-0 w-0.5 bg-gradient-to-b from-red-500 via-red-500 to-red-500/50 -translate-x-1/2 transition-all duration-300 shadow-lg shadow-red-500/50"
              :style="{ height: `${Math.min(scrollProgress * 1.2, 100)}%` }"
            />

            <!-- Scrolling Light Effect -->
            <div
              class="absolute left-1/2 size-4 rounded-full bg-red-500 shadow-2xl shadow-red-500 transition-all duration-300 ease-out pointer-events-none"
              :style="{
                top: `${Math.min(scrollProgress * 1.2, 100)}%`,
                opacity: scrollProgress > 0 && scrollProgress < 85 ? 1 : 0,
                transform: 'translate(-50%, -50%)',
              }"
            >
              <div class="absolute inset-0 rounded-full bg-red-500 animate-ping" />
              <div class="absolute inset-0 rounded-full bg-red-500 blur-xl" />
            </div>

            <!-- Milestones -->
            <div class="space-y-16">
              <Motion
                v-for="(milestone, index) in milestones"
                :key="index"
                :initial="{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }"
                :animate="{ opacity: 1, x: 0 }"
                :transition="{ duration: 0.6, delay: index * 0.15 }"
              >
                <div
                  class="relative flex items-center"
                  :class="index % 2 === 0 ? 'justify-start' : 'justify-end'"
                >
                  <!-- Content Card -->
                  <div class="w-5/12">
                    <UCard
                      class="relative group hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2"
                      :class="[
                        index % 2 === 0 ? 'mr-auto' : 'ml-auto',
                        milestone.status === 'in-progress' ? 'border-primary/30 shadow-lg shadow-primary/10' : '',
                      ]"
                    >
                      <!-- Glow effect for active milestone -->
                      <div
                        v-if="milestone.status === 'in-progress'"
                        class="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 rounded-lg blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500"
                      />
                      <div class="space-y-4 relative">
                        <div class="flex items-start justify-between gap-4">
                          <div class="flex items-center gap-3">
                            <div
                              class="relative flex items-center justify-center size-12 rounded-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                              :class="milestone.status === 'in-progress'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'"
                            >
                              <UIcon
                                :name="milestone.icon"
                                class="size-6"
                              />
                              <div
                                v-if="milestone.status === 'in-progress'"
                                class="absolute inset-0 rounded-lg bg-primary/20 blur-md animate-pulse"
                              />
                            </div>
                            <div>
                              <div class="text-sm text-muted-foreground">
                                Milestone {{ milestone.number }}
                              </div>
                              <h3 class="font-semibold text-lg group-hover:text-primary transition-colors duration-300">
                                {{ milestone.title }}
                              </h3>
                            </div>
                          </div>
                          <UBadge
                            :color="milestone.status === 'in-progress' ? 'primary' : 'neutral'"
                            variant="subtle"
                            size="xs"
                            class="animate-pulse"
                          >
                            {{ t(`redwire.${milestone.status.replace('-', '_')}`) }}
                          </UBadge>
                        </div>

                        <p class="text-sm text-muted-foreground">
                          {{ milestone.description }}
                        </p>

                        <div class="flex flex-wrap gap-2">
                          <span
                            v-for="tech in milestone.tech"
                            :key="tech"
                            class="px-2 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors duration-300 cursor-default"
                          >
                            {{ tech }}
                          </span>
                        </div>
                      </div>
                    </UCard>
                  </div>

                  <!-- Center Node -->
                  <div
                    class="absolute left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full transition-all duration-500 hover:scale-125 z-10"
                    :class="[
                      milestone.status === 'in-progress'
                        ? 'size-12 bg-white border-4 border-white shadow-2xl shadow-red-500/50'
                        : isMilestonePassed(index)
                          ? 'size-4 bg-red-500/40 shadow-md shadow-red-500/30'
                          : 'size-4 bg-border group-hover:bg-primary/30 group-hover:shadow-lg group-hover:shadow-primary/30',
                    ]"
                  >
                    <div
                      v-if="milestone.status === 'in-progress'"
                      class="size-5 rounded-full bg-red-500 animate-pulse"
                    />
                    <div
                      v-if="milestone.status === 'in-progress'"
                      class="absolute -inset-2 rounded-full bg-red-500/30 blur-md animate-pulse"
                    />
                    <div
                      v-if="milestone.status === 'in-progress'"
                      class="absolute -inset-4 rounded-full bg-red-500/20 blur-xl animate-pulse"
                    />
                  </div>
                </div>
              </Motion>
            </div>
          </div>
        </div>

        <!-- Mobile Timeline -->
        <div class="lg:hidden max-w-2xl mx-auto">
          <div class="relative pl-8">
            <!-- Vertical Line -->
            <div class="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />

            <!-- Progress Line with Glow -->
            <div
              class="absolute left-3 top-0 w-0.5 bg-gradient-to-b from-red-500 to-red-500/50 shadow-lg shadow-red-500/50 transition-all duration-300"
              :style="{ height: `${Math.min(scrollProgress * 1.5, 100)}%` }"
            />

            <!-- Scrolling Light Effect -->
            <div
              class="absolute left-3 -translate-x-1/2 size-3 rounded-full bg-red-500 shadow-xl shadow-red-500 transition-all duration-300 ease-out pointer-events-none"
              :style="{
                top: `${Math.min(scrollProgress * 1.5, 100)}%`,
                opacity: scrollProgress > 0 && scrollProgress < 70 ? 1 : 0,
              }"
            >
              <div class="absolute inset-0 rounded-full bg-red-500 animate-ping" />
            </div>

            <!-- Milestones -->
            <div class="space-y-8">
              <Motion
                v-for="(milestone, index) in milestones"
                :key="index"
                :initial="{ opacity: 0, x: 20 }"
                :animate="{ opacity: 1, x: 0 }"
                :transition="{ duration: 0.6, delay: index * 0.1 }"
              >
                <div class="relative">
                  <!-- Node -->
                  <div
                    class="absolute -left-[1.6rem] top-4 flex items-center justify-center rounded-full transition-all duration-300 z-10"
                    :class="[
                      milestone.status === 'in-progress'
                        ? 'size-8 bg-white border-4 border-white shadow-xl shadow-red-500/50'
                        : isMilestonePassed(index)
                          ? 'size-3 bg-red-500/40 shadow-sm shadow-red-500/30'
                          : 'size-3 bg-border hover:bg-primary/30 hover:scale-125',
                    ]"
                  >
                    <div
                      v-if="milestone.status === 'in-progress'"
                      class="size-3 rounded-full bg-red-500 animate-pulse"
                    />
                    <div
                      v-if="milestone.status === 'in-progress'"
                      class="absolute -inset-1 rounded-full bg-red-500/30 blur-md animate-pulse"
                    />
                    <div
                      v-if="milestone.status === 'in-progress'"
                      class="absolute -inset-3 rounded-full bg-red-500/20 blur-lg animate-pulse"
                    />
                  </div>

                  <!-- Content -->
                  <UCard
                    class="group hover:border-primary/40 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
                    :class="milestone.status === 'in-progress' ? 'border-primary/30 shadow-lg shadow-primary/5' : ''"
                  >
                    <div
                      v-if="milestone.status === 'in-progress'"
                      class="absolute -inset-1 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    <div class="space-y-4 relative">
                      <div class="flex items-start justify-between gap-4">
                        <div class="flex items-center gap-3">
                          <div
                            class="relative flex items-center justify-center size-10 rounded-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                            :class="milestone.status === 'in-progress'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'"
                          >
                            <UIcon
                              :name="milestone.icon"
                              class="size-5"
                            />
                            <div
                              v-if="milestone.status === 'in-progress'"
                              class="absolute inset-0 rounded-lg bg-primary/20 blur-md animate-pulse"
                            />
                          </div>
                          <div>
                            <div class="text-xs text-muted-foreground">
                              Milestone {{ milestone.number }}
                            </div>
                            <h3 class="font-semibold group-hover:text-primary transition-colors duration-300">
                              {{ milestone.title }}
                            </h3>
                          </div>
                        </div>
                        <UBadge
                          :color="milestone.status === 'in-progress' ? 'primary' : 'neutral'"
                          variant="subtle"
                          size="xs"
                        >
                          {{ t(`redwire.${milestone.status.replace('-', '_')}`) }}
                        </UBadge>
                      </div>

                      <p class="text-sm text-muted-foreground">
                        {{ milestone.description }}
                      </p>

                      <div class="flex flex-wrap gap-2">
                        <span
                          v-for="tech in milestone.tech"
                          :key="tech"
                          class="px-2 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors duration-300"
                        >
                          {{ tech }}
                        </span>
                      </div>
                    </div>
                  </UCard>
                </div>
              </Motion>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- What This Demonstrates -->
    <section class="relative border-b border-border overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />

      <div class="container mx-auto px-4 py-16 relative">
        <Motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.6 }"
        >
          <div class="text-center space-y-4 mb-12">
            <h2 class="text-3xl md:text-4xl font-bold">
              {{ t('redwire.demonstrates') }}
            </h2>
          </div>
        </Motion>

        <div class="max-w-3xl mx-auto">
          <UCard class="relative overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500">
            <div class="absolute top-0 right-0 size-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <ul class="space-y-4 relative">
              <Motion
                v-for="(item, index) in demonstrates"
                :key="index"
                :initial="{ opacity: 0, x: -20 }"
                :animate="{ opacity: 1, x: 0 }"
                :transition="{ duration: 0.6, delay: index * 0.5 }"
              >
                <li class="flex items-start gap-3 group cursor-default hover:translate-x-2 transition-transform duration-300">
                  <UIcon
                    name="i-ph-check-circle-duotone"
                    class="size-6 text-primary flex-shrink-0 mt-0.5 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300"
                  />
                  <span class="text-muted-foreground group-hover:text-foreground transition-colors duration-300">{{ item }}</span>
                </li>
              </Motion>
            </ul>
          </UCard>
        </div>
      </div>
    </section>

    <!-- Why This Matters -->
    <section class="relative py-16 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
      <div
        class="absolute bottom-0 left-1/4 size-96 bg-primary/20 rounded-full blur-3xl animate-pulse"
        style="animation-duration: 4s;"
      />

      <div class="container mx-auto px-4 relative">
        <Motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.6 }"
        >
          <div class="max-w-4xl mx-auto">
            <UCard class="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 group">
              <div class="absolute -top-10 -right-10 size-40 bg-primary/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <div class="space-y-4 relative">
                <div class="flex items-center gap-3">
                  <div class="relative">
                    <UIcon
                      name="i-ph-lightbulb-duotone"
                      class="size-8 text-primary group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500"
                    />
                    <div class="absolute inset-0 size-8 bg-primary/30 rounded-full blur-lg animate-pulse" />
                  </div>
                  <h2 class="text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors duration-500">
                    {{ t('redwire.why_this_matters') }}
                  </h2>
                </div>
                <p class="text-lg text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-500">
                  {{ t('redwire.why_desc') }}
                </p>
              </div>
            </UCard>
          </div>
        </Motion>
      </div>
    </section>

    <!-- GitHub CTA Section -->
    <section class="relative py-16 overflow-hidden border-t border-border">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
      <div class="absolute top-0 left-0 size-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div
        class="absolute bottom-0 right-0 size-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
        style="animation-delay: 1.5s;"
      />

      <div class="container mx-auto px-4 relative">
        <Motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.6 }"
        >
          <div class="max-w-4xl mx-auto text-center space-y-8">
            <div class="space-y-4">
              <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                <UIcon
                  name="i-ph-github-logo"
                  class="size-4"
                />
                Open Source
              </div>
              <h2 class="text-3xl md:text-4xl font-bold">
                {{ t('redwire.check_progress') }}
              </h2>
              <p class="text-muted-foreground max-w-2xl mx-auto">
                {{ t('redwire.github_desc') }}
              </p>
            </div>

            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
              <UButton
                to="https://github.com/AlexandreOttmann/realtime-ai-ops-platform"
                target="_blank"
                size="xl"
                color="primary"
                variant="solid"
                class="group relative overflow-hidden"
              >
                <div class="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary bg-[length:200%_100%] animate-shimmer" />
                <div class="relative flex items-center gap-2">
                  <UIcon
                    name="i-ph-github-logo"
                    class="size-5"
                  />
                  {{ t('redwire.view_on_github') }}
                  <UIcon
                    name="i-ph-arrow-up-right"
                    class="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                  />
                </div>
              </UButton>
              <UButton
                to="https://github.com/AlexandreOttmann/realtime-ai-ops-platform"
                target="_blank"
                size="xl"
                variant="outline"
                class="group"
              >
                <UIcon
                  name="i-ph-star-duotone"
                  class="size-5 text-amber-500 group-hover:scale-110 transition-transform"
                />
                {{ t('redwire.star_on_github') }}
              </UButton>
            </div>

            <!-- GitHub Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
              <UCard
                class="group hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              >
                <div class="text-center space-y-2">
                  <UIcon
                    name="i-ph-git-branch-duotone"
                    class="size-8 mx-auto text-primary group-hover:scale-110 transition-transform"
                  />
                  <div class="text-2xl font-bold">
                    7
                  </div>
                  <div class="text-sm text-muted-foreground">
                    Milestones
                  </div>
                </div>
              </UCard>
              <UCard
                class="group hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              >
                <div class="text-center space-y-2">
                  <UIcon
                    name="i-ph-stack-duotone"
                    class="size-8 mx-auto text-primary group-hover:scale-110 transition-transform"
                  />
                  <div class="text-2xl font-bold">
                    9+
                  </div>
                  <div class="text-sm text-muted-foreground">
                    Technologies
                  </div>
                </div>
              </UCard>
              <UCard
                class="group hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              >
                <div class="text-center space-y-2">
                  <UIcon
                    name="i-ph-code-duotone"
                    class="size-8 mx-auto text-primary group-hover:scale-110 transition-transform"
                  />
                  <div class="text-2xl font-bold">
                    Production
                  </div>
                  <div class="text-sm text-muted-foreground">
                    Grade Quality
                  </div>
                </div>
              </UCard>
            </div>
          </div>
        </Motion>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: `${t('redwire.title')} - ${t('redwire.subtitle')}`,
  description: t('redwire.tagline'),
  ogTitle: `${t('redwire.title')} - ${t('redwire.subtitle')}`,
  ogDescription: t('redwire.tagline'),
  twitterTitle: `${t('redwire.title')} - ${t('redwire.subtitle')}`,
  twitterDescription: t('redwire.tagline'),
})

// Scroll progress tracking
const scrollProgress = ref(0)
const timelineRef = ref<HTMLElement | null>(null)

onMounted(() => {
  const handleScroll = () => {
    if (!timelineRef.value)
      return

    const timelineTop = timelineRef.value.offsetTop
    const timelineHeight = timelineRef.value.offsetHeight
    const windowHeight = window.innerHeight
    const scrollTop = window.scrollY

    const start = timelineTop - windowHeight / 2
    const end = timelineTop + timelineHeight - windowHeight / 2

    if (scrollTop < start) {
      scrollProgress.value = 0
    }
    else if (scrollTop > end) {
      scrollProgress.value = 100
    }
    else {
      scrollProgress.value = ((scrollTop - start) / (end - start)) * 100
    }
  }

  window.addEventListener('scroll', handleScroll)
  handleScroll()

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
})

// Helper to check if milestone has been passed by scroll
const isMilestonePassed = (index: number) => {
  const milestonePosition = (index / 7) * 100
  return scrollProgress.value > milestonePosition
}

const milestones = computed(() => [
  {
    number: 1,
    icon: 'i-ph-layout-duotone',
    title: t('redwire.milestone_1'),
    description: t('redwire.milestone_1_desc'),
    status: 'in-progress' as const,
    tech: ['Next.js', 'TanStack Query', 'shadcn/ui'],
  },
  {
    number: 2,
    icon: 'i-ph-database-duotone',
    title: t('redwire.milestone_2'),
    description: t('redwire.milestone_2_desc'),
    status: 'planned' as const,
    tech: ['Fastify', 'PostgreSQL', 'RBAC'],
  },
  {
    number: 3,
    icon: 'i-ph-lightning-duotone',
    title: t('redwire.milestone_3'),
    description: t('redwire.milestone_3_desc'),
    status: 'planned' as const,
    tech: ['WebSockets', 'Optimistic UI'],
  },
  {
    number: 4,
    icon: 'i-ph-flow-arrow-duotone',
    title: t('redwire.milestone_4'),
    description: t('redwire.milestone_4_desc'),
    status: 'planned' as const,
    tech: ['Kafka', 'Event Sourcing'],
  },
  {
    number: 5,
    icon: 'i-ph-brain-duotone',
    title: t('redwire.milestone_5'),
    description: t('redwire.milestone_5_desc'),
    status: 'planned' as const,
    tech: ['OpenAI', 'LLM', 'ChatOps'],
  },
  {
    number: 6,
    icon: 'i-ph-cube-duotone',
    title: t('redwire.milestone_6'),
    description: t('redwire.milestone_6_desc'),
    status: 'planned' as const,
    tech: ['Docker', 'Kubernetes', 'CI/CD'],
  },
  {
    number: 7,
    icon: 'i-ph-chart-line-up-duotone',
    title: t('redwire.milestone_7'),
    description: t('redwire.milestone_7_desc'),
    status: 'planned' as const,
    tech: ['Sentry', 'Prometheus', 'Grafana'],
  },
])

const principles = computed(() => [
  {
    icon: 'i-ph-stack-duotone',
    title: t('redwire.progressive'),
    description: t('redwire.progressive_desc'),
  },
  {
    icon: 'i-ph-graph-duotone',
    title: t('redwire.boundaries'),
    description: t('redwire.boundaries_desc'),
  },
  {
    icon: 'i-ph-broadcast-duotone',
    title: t('redwire.events'),
    description: t('redwire.events_desc'),
  },
  {
    icon: 'i-ph-robot-duotone',
    title: t('redwire.ai'),
    description: t('redwire.ai_desc'),
  },
  {
    icon: 'i-ph-rocket-launch-duotone',
    title: t('redwire.production'),
    description: t('redwire.production_desc'),
  },
])

const demonstrates = computed(() => [
  t('redwire.demonstrates_react'),
  t('redwire.demonstrates_events'),
  t('redwire.demonstrates_cloud'),
  t('redwire.demonstrates_ai'),
  t('redwire.demonstrates_judgment'),
])

const techStack = computed(() => [
  {
    icon: 'i-ph-layout-duotone',
    title: t('redwire.tech_nextjs'),
    description: t('redwire.tech_nextjs_desc'),
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: 'i-ph-database-duotone',
    title: t('redwire.tech_tanstack'),
    description: t('redwire.tech_tanstack_desc'),
    color: 'from-red-500 to-orange-500',
  },
  {
    icon: 'i-ph-palette-duotone',
    title: t('redwire.tech_shadcn'),
    description: t('redwire.tech_shadcn_desc'),
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: 'i-ph-lightning-duotone',
    title: t('redwire.tech_fastify'),
    description: t('redwire.tech_fastify_desc'),
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: 'i-ph-shield-check-duotone',
    title: t('redwire.tech_cognito'),
    description: t('redwire.tech_cognito_desc'),
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: 'i-ph-flow-arrow-duotone',
    title: t('redwire.tech_kafka'),
    description: t('redwire.tech_kafka_desc'),
    color: 'from-gray-500 to-slate-500',
  },
  {
    icon: 'i-ph-cylinder-duotone',
    title: t('redwire.tech_postgres'),
    description: t('redwire.tech_postgres_desc'),
    color: 'from-blue-600 to-indigo-600',
  },
  {
    icon: 'i-ph-brain-duotone',
    title: t('redwire.tech_ai'),
    description: t('redwire.tech_ai_desc'),
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: 'i-ph-chart-line-up-duotone',
    title: t('redwire.tech_observability'),
    description: t('redwire.tech_observability_desc'),
    color: 'from-amber-500 to-yellow-500',
  },
])
</script>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 3s infinite;
}

@keyframes gradient {
  0%, 100% {
    background-size: 200% 200%;
    background-position: 0% 50%;
  }
  50% {
    background-size: 200% 200%;
    background-position: 100% 50%;
  }
}

.animate-gradient {
  animation: gradient 3s ease infinite;
}
</style>
