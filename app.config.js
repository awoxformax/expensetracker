export default {
  expo: {
    name: "expensetracker",
    slug: "expensetracker",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.svg",
    userInterfaceStyle: "light",

    extra: {
      eas: {
        projectId: "ab636664-bcc4-4a4b-88e4-0b4f0c56a135"
      },
      apiUrl: process.env.EXPO_PUBLIC_API_BASE_URL
    },

    plugins: ["expo-router", "expo-notifications"]
  }
};
