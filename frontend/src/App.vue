<script setup></script>
  import { RouterLink, RouterView } from 'vue-router'
<template>
  <div class="app-container">
    <aside class="sidebar">
      <div class="logo">
        <h2>Cerâmica</h2>
      </div>

      <nav class="menu">
        <RouterLink to="/" class="menu-item">
          Dashboard
        </RouterLink>
        <RouterLink to="/estoque" class="menu-item">
          Estoque
        </RouterLink>
        <RouterLink to="/entradas" class="menu-item">
          Nova Entrada
        </RouterLink>
        <RouterLink to="/historico" class="menu-item">
          Historico
        </RouterLink>
      </nav>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <span>Bem-vinda, Bianca!</span>
      </header>

      <div class="page-content">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
  :global(body, html) {
    margin: 0;
    padding: 0;
    height: 100vh;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f4f7f6;
    color : #333;
  }

  .app-container {
    display: flex;
    height: 100vh;
    width: 100vw;
  }

  .sidebar {
    width: 250px;
    background-color: #2c3e50;
    color: white;
    display: flex;
    flex-direction: column;
  }

  .logo {
    padding: 20px;
    text-align: center;
    border-bottom: 1px solid #34495e;
  }

  .logo h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #ecf0f1;
  }

  .menu {
    display: flex;
    flex-direction: column;
    padding: 20px 0;
  }

  .menu-item {
    padding: 15px 25px;
    color: #bdc3c7;
    text-decoration: none;
    font-size: 1.1rem;
    transition: background-color 0.3s, color 0.3s;
  }

  .menu-item:hover,
  .menu-item.router-link-active {
    background-color: #34495e;
    color: white;
    border-left: 4px solid #3498db;
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .topbar {
    background-color: white;
    padding: 15px 30px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .page-content {
    padding: 30px;
    overflow-y: auto;
    flex: 1;
  }
</style>
  
