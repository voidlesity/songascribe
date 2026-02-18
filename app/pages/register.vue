<template>
  <div class="min-h-screen flex items-center justify-center bg-base-100 p-4">
    <div class="card w-full max-w-md bg-base-200 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-3xl font-bold text-center mb-6">
          Create Account
        </h2>

        <form @submit.prevent="handleRegister">
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Name</span>
            </label>
            <input
              v-model="name"
              type="text"
              placeholder="Enter your name"
              class="input input-bordered"
              required
              :disabled="loading"
            />
          </div>

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
            <label class="label">
              <span class="label-text-alt text-xs opacity-70">
                Must be at least 8 characters with uppercase, lowercase, and
                numbers
              </span>
            </label>
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Confirm Password</span>
            </label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm your password"
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
              <span v-else>Register</span>
            </button>
          </div>
        </form>

        <div class="divider">OR</div>

        <div class="text-center">
          <p class="text-sm">
            Already have an account?
            <button @click="$router.push('/login')" class="link link-primary">
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");

const { loggedIn } = useUserSession();

// Redirect if already logged in
watchEffect(() => {
  if (loggedIn.value) {
    navigateTo("/");
  }
});

async function handleRegister() {
  error.value = "";

  // Validate passwords match
  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match";
    return;
  }

  loading.value = true;

  try {
    const response = await $fetch("/api/auth/register", {
      method: "POST",
      body: {
        name: name.value,
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
    console.error("Registration error:", err);
    error.value =
      err.data?.message || "Failed to create account. Please try again.";
  } finally {
    loading.value = false;
  }
}
</script>
