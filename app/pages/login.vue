<template>
  <div class="hero min-h-[95vh]">
    <div class="hero-content">
      <div class="flex w-full flex-col lg:flex-row">
        <fieldset
          class="fieldset bg-base-100 border-base-200 rounded-box w-full border p-6"
        >
          <legend class="fieldset-legend">Sign In</legend>

          <label class="input">
            <Icon name="mdi:user" size="1.25rem" style="opacity: 50%" />
            <input
              v-on:keyup.enter="handleLogin()"
              v-model="usermail"
              type="search"
              placeholder="Username or Email"
            />
          </label>

          <label class="input">
            <Icon name="mdi:key" size="1.25rem" style="opacity: 50%" />
            <input
              v-on:keyup.enter="handleLogin()"
              v-model="password"
              type="password"
              placeholder="Password"
            />
          </label>

          <button @click="handleLogin()" class="btn btn-primary mt-4">
            <Icon name="mdi:login" size="1.25rem" />
            Login
          </button>
        </fieldset>

        <div class="divider lg:divider-horizontal">or</div>

        <fieldset
          class="fieldset bg-base-100 border-base-200 rounded-box w-full border p-6"
        >
          <legend class="fieldset-legend">Register</legend>

          <label class="input">
            <Icon name="mdi:account" size="1.25rem" style="opacity: 50%" />
            <input
              v-on:keyup.enter="handleRegister()"
              v-model="displayName"
              type="search"
              placeholder="Display name"
            />
          </label>

          <label class="input">
            <Icon name="mdi:at" size="1.25rem" style="opacity: 50%" />
            <input
              v-on:keyup.enter="handleRegister()"
              v-model="username"
              type="search"
              placeholder="Username (login handle)"
            />
          </label>

          <label class="input">
            <Icon name="mdi:email" size="1.25rem" style="opacity: 50%" />
            <input
              v-on:keyup.enter="handleRegister()"
              v-model="email"
              type="email"
              placeholder="Email"
            />
          </label>

          <label class="input">
            <Icon name="mdi:key" size="1.25rem" style="opacity: 50%" />
            <input
              v-on:keyup.enter="handleRegister()"
              v-model="regPassword"
              type="password"
              placeholder="Password"
            />
          </label>

          <label class="input">
            <Icon name="mdi:key-outline" size="1.25rem" style="opacity: 50%" />
            <input
              v-on:keyup.enter="handleRegister()"
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm Password"
            />
          </label>

          <button @click="handleRegister()" class="btn btn-secondary mt-4">
            <Icon name="mdi-register" size="1.25rem" />
            Register
          </button>
        </fieldset>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ["logged-in"],
});

const usermail = ref("");
const password = ref("");

const displayName = ref("");
const username = ref("");
const email = ref("");
const regPassword = ref("");
const confirmPassword = ref("");

async function handleLogin() {
  try {
    await $fetch("/api/auth/login", {
      method: "POST",
      body: {
        login: usermail.value,
        password: password.value,
      },
    });
    await navigateTo("/");
    window.location.reload();
  } catch (err) {
    console.error("Login error:", err);
  }
}

async function handleRegister() {
  if (regPassword.value !== confirmPassword.value) {
    console.error("Passwords do not match");
    return;
  }
  try {
    await $fetch("/api/auth/register", {
      method: "POST",
      body: {
        displayName: displayName.value,
        username: username.value,
        email: email.value,
        password: regPassword.value,
      },
    });
    await navigateTo("/");
    window.location.reload();
  } catch (err) {
    console.error("Registration error:", err);
  }
}
</script>
