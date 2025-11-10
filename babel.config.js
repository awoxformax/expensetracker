module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
            "@/src": "./src",
            "@/src/lib": "./src/lib"
          }
        }
      ],
      "expo-router/babel"
    ]
  };
};
