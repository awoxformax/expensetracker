# expensetracker
An application where people can report their daily expenses

## Mobile backend configuration

The app reads its API endpoint from the `EXPO_PUBLIC_API_BASE_URL` variable.  
Set it to a URL that your phone can reach before starting Expo:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="https://your-ngrok-or-server-url"; npx expo start
```

If you are on the same Wi-Fi as your development machine you can skip the variable and the app will automatically re-use the Metro host (`http://<your-lan-ip>:4000`).
