export default [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        firebase: "readonly",
        db: "readonly",
        navigator: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",
        CustomEvent: "readonly",
        Math: "readonly",
        SpeechSynthesisUtterance: "readonly",
        IntersectionObserver: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["off"],
      "no-undef": "error"
    }
  }
];
