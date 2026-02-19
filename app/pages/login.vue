<template>
  <div class="min-h-screen flex items-center justify-center bg-base-100 p-4">
    <div class="card w-full max-w-md bg-base-200 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-3xl font-bold text-center mb-6">
          Welcome Back
        </h2>

        <form @submit.prevent="handleLogin">
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Email</span>
            </label>
            <input
              v-model="email"
              type="email"
              placeholder="Enter your email"
              class="input input-bordered"
              required
              :disabled="loading"
            />
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Password</span>
            </label>
            <input
              v-model="password"
              type="password"
              placeholder="Enter your password"
              class="input input-bordered"
              required
              :disabled="loading"
            />
          </div>

          <div v-if="error" class="alert alert-error mb-4">
            <Icon name="ic:round-error" size="1.2rem" />
            <span>{{ error }}</span>
          </div>

          <div class="form-control mt-6">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="loading loading-spinner"></span>
              <span v-else>Login</span>
            </button>
          </div>
        </form>

        <div class="divider">OR</div>

        <div class="text-center">
          <p class="text-sm">
            Don't have an account?
            <button
              @click="$router.push('/register')"
              class="link link-primary"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const { loggedIn } = useUserSession();

// Redirect if already logged in
watchEffect(() => {
  if (loggedIn.value) {
    navigateTo("/");
  }
});

async function handleLogin() {
  error.value = "";
  loading.value = true;

  try {
    const response = await $fetch("/api/auth/login", {
      method: "POST",
      body: {
        email: email.value,
        password: password.value,
      },
    });

    if (response.success) {
      // Refresh the page to update session
      await navigateTo("/");
      window.location.reload();
    }
  } catch (err) {
    console.error("Login error:", err);
    error.value = err.data?.message || "Invalid email or password";
  } finally {
    loading.value = false;
  }
}
</script>
