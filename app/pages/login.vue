<template>
  <div class="min-h-[70vh] flex items-center justify-center p-4">
    <div
      class="card bg-base-100 border border-base-300 w-full max-w-md shadow-xl"
    >
      <div class="card-body">
        <div class="flex items-center gap-2 mb-2">
          <Icon name="mdi:book-music" class="text-primary" size="1.6rem" />
          <h1 class="text-xl font-semibold">Songascribe</h1>
        </div>

        <div role="tablist" class="tabs tabs-box mb-4">
          <button
            role="tab"
            class="tab"
            :class="{ 'tab-active': mode === 'login' }"
            @click="mode = 'login'"
          >
            Sign in
          </button>
          <button
            role="tab"
            class="tab"
            :class="{ 'tab-active': mode === 'register' }"
            @click="mode = 'register'"
          >
            Create account
          </button>
        </div>

        <form
          v-if="mode === 'login'"
          class="space-y-3"
          @submit.prevent="handleLogin"
        >
          <label class="input w-full">
            <Icon name="mdi:account" class="opacity-60" />
            <input
              v-model="login.identifier"
              type="text"
              placeholder="Username or email"
              required
              autofocus
            />
          </label>
          <label class="input w-full">
            <Icon name="mdi:lock" class="opacity-60" />
            <input
              v-model="login.password"
              type="password"
              placeholder="Password"
              required
            />
          </label>

          <p v-if="error" class="text-error text-sm">{{ error }}</p>

          <button
            type="submit"
            class="btn btn-primary w-full"
            :disabled="submitting"
          >
            <span
              v-if="submitting"
              class="loading loading-spinner loading-xs"
            />
            Sign in
          </button>
        </form>

        <form v-else class="space-y-3" @submit.prevent="handleRegister">
          <label class="input w-full">
            <Icon name="mdi:at" class="opacity-60" />
            <input
              v-model="register.username"
              type="text"
              placeholder="Username"
              pattern="[a-z0-9_.\-]{3,32}"
              required
            />
          </label>
          <label class="input w-full">
            <Icon name="mdi:email" class="opacity-60" />
            <input
              v-model="register.email"
              type="email"
              placeholder="Email"
              required
            />
          </label>
          <label class="input w-full">
            <Icon name="mdi:lock" class="opacity-60" />
            <input
              v-model="register.password"
              type="password"
              placeholder="Password"
              required
            />
          </label>
          <label class="input w-full">
            <Icon name="mdi:lock-check" class="opacity-60" />
            <input
              v-model="register.confirm"
              type="password"
              placeholder="Confirm password"
              required
            />
          </label>

          <p v-if="error" class="text-error text-sm">{{ error }}</p>

          <button
            type="submit"
            class="btn btn-primary w-full"
            :disabled="submitting"
          >
            <span
              v-if="submitting"
              class="loading loading-spinner loading-xs"
            />
            Create account
          </button>
        </form>
        <div class="flex flex-wrap items-center justify-center gap-2 pt-1">
          <NuxtLink to="/intro" class="btn btn-link btn-sm">
            What is Songascribe?
          </NuxtLink>
          <NuxtLink to="/browse" class="btn btn-link btn-sm">
            Browse public categories
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getApiErrorMessage } from "~/services/api";
import { authApi } from "~/services/auth";

definePageMeta({ middleware: ["guest"], layout: "public" });
useSeoMeta({ title: "Sign in · Songascribe" });

const { fetch: refreshSession } = useUserSession();

const mode = ref<"login" | "register">("login");
const error = ref("");
const submitting = ref(false);

const login = ref({ identifier: "", password: "" });
const register = ref({
  username: "",
  email: "",
  password: "",
  confirm: "",
});

async function handleLogin() {
  error.value = "";
  submitting.value = true;
  try {
    await authApi.login({
      login: login.value.identifier,
      password: login.value.password,
    });
    await refreshSession();
    await navigateTo("/");
  } catch (e) {
    error.value = getApiErrorMessage(e, "Login failed");
  } finally {
    submitting.value = false;
  }
}

async function handleRegister() {
  error.value = "";
  if (register.value.password !== register.value.confirm) {
    error.value = "Passwords don't match";
    return;
  }
  submitting.value = true;
  try {
    await authApi.register({
      username: register.value.username,
      email: register.value.email,
      password: register.value.password,
    });
    await refreshSession();
    await navigateTo("/");
  } catch (e) {
    error.value = getApiErrorMessage(e, "Registration failed");
  } finally {
    submitting.value = false;
  }
}
</script>
