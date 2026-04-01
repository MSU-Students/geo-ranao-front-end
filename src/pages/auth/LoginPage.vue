<template>
  <q-page>
    <h1>Login Page</h1>
    <p>This is the login page. You can add your login form here.</p>
    <q-input filled v-model="username" label="Username" />
    <q-input filled v-model="password" label="Password" type="password" />
    <q-btn label="Login" color="primary" @click="handleLogin" />
  </q-page>
</template>
<script setup lang="ts">
import { ref } from 'vue';

const username = ref('');
const password = ref('');

function handleLogin() {
  // Handle login logic here
}
</script>
