# Vtron

<p align="center">
  <img width="200" src="./assert/vtron-logo-nobg.png" alt="vtron logo">
</p>

<div align="center">
  Vtron: A Win10 UI framework based on Vue3
</div>

<div align="center">
  <a href="https://vtron.site/doc" target="_blank">Documentation</a> |
  <a href="https://vtron.site/doc" target="_blank">Official Website</a> |
  <a href="http://vtron.site/win/" target="_blank">Demo</a>
</div>

<div align="center">
  <em>Recommended: Vue 3 + TypeScript + Vite
</div>

![GitHub issues](https://img.shields.io/github/issues/royalknight56/vtron)
![GitHub](https://img.shields.io/github/license/royalknight56/vtron)
![GitHub last commit](https://img.shields.io/github/last-commit/royalknight56/vtron)
![GitHub Repo stars](https://img.shields.io/github/stars/royalknight56/vtron?style=social)
![GitHub forks](https://img.shields.io/github/forks/royalknight56/vtron?style=social)

## Introduction

Vtron is a framework that allows you to create web applications with a Windows 10-like interface using Vue 3. It provides a set of components and utilities to build a desktop-like experience in the browser.

## Features

- File system: Upload, preview, edit, and save files for long-term storage.
- Terminal system: Control files through a terminal interface.
- JavaScript execution: Execute saved JavaScript files.
- App store: Download and save applications for long-term use.
- Plugin mechanism for development: Control the system state.

## Installation

```bash
npm install vtron
```

## Quick Start

1. Import the Vtron styles in your main entry file:

```javascript
import 'vtron/distlib/style.css';
```

2. Create a System instance and use the VtronComputer component in your Vue application:

```vue
<template>
  <div class="outer">
    <VtronComputer :system="system"></VtronComputer>
  </div>
</template>

<script setup>
import { System, VtronComputer } from 'vtron';
let system = new System();
</script>

<style scoped>
.outer {
  width: 100vw;
  height: 100vh;
}
</style>
```

3. Configure your desktop apps and start developing!

## Documentation

For detailed usage and API documentation, please visit our [official documentation](https://vtron.site/doc).

## Contributing

We welcome contributions to Vtron! Please read our contributing guidelines before submitting pull requests.


## License

Vtron is licensed under the [Apache License 2.0](LICENSE).

## Acknowledgements

Thank you to all our contributors and supporters!

---

<div align="center">
  <img src="https://komarev.com/ghpvc/?username=royalknight56&color=blue" alt="profile views" />
</div>