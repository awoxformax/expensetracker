export default ({ config }) => ({
  ...config,

  name: "ExpenseTracker",
  slug: "expensetracker",

  icon: "./assets2/logo.svg",

  android: {
    adaptiveIcon: {
      foregroundImage: "./assets2/logo.svg",
      backgroundColor: "#FFFFFF"
    }
  },

  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    eas: {
      projectId: "ab636664-bcc4-4a4b-88e4-0b4f0c56a135"
    }
  }
});
